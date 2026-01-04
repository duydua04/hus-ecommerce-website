import json
import logging
from typing import Dict, List
from dataclasses import dataclass

import redis.asyncio as redis
from fastapi import WebSocket

from ..config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class WebSocketConnection:
    websocket: WebSocket


class SocketConnectionManager:
    """
    Quản lý kết nối WebSocket và cơ chế Pub/Sub qua Redis.
    """

    def __init__(self):
        # Lưu socket: key = "role_userid" (vd: "admin_1", "seller_50")
        self.active_connections: Dict[str, List[WebSocketConnection]] = {}

        # Redis Clients
        self.redis: redis.Redis | None = None
        self.redis_pub: redis.Redis | None = None
        self.redis_sub: redis.Redis | None = None
        self.pubsub = None

    async def connect_redis(self):
        """Dùng cho Main API (FastAPI) khi khởi động"""
        try:
            self.redis_pub = redis.from_url(settings.redis_url_cache, decode_responses=True)
            self.redis_sub = redis.from_url(settings.redis_url_cache, decode_responses=True)
            self.pubsub = self.redis_sub.pubsub()

            # Gán alias để tránh lỗi logic cũ
            self.redis = self.redis_pub
            logger.info("[SOCKET] Connected to Redis Pub/Sub successfully.")
        except Exception as e:
            logger.error(f"[SOCKET ERROR] Connect Redis failed: {e}")

    async def close_redis(self):
        """Dọn dẹp kết nối"""
        if self.pubsub: await self.pubsub.close()
        if self.redis_sub: await self.redis_sub.close()
        if self.redis_pub: await self.redis_pub.close()

    async def connect_socket(self, websocket: WebSocket, user_id: int, role: str):
        await websocket.accept()
        key = self.get_connection_key(user_id, role)

        if key not in self.active_connections:
            self.active_connections[key] = []

        self.active_connections[key].append(WebSocketConnection(websocket))

    def disconnect_socket(self, websocket: WebSocket, user_id: int, role: str):
        key = self.get_connection_key(user_id, role)
        if key in self.active_connections:
            self.active_connections[key] = [
                conn for conn in self.active_connections[key]
                if conn.websocket != websocket
            ]
            if not self.active_connections[key]:
                del self.active_connections[key]

    @staticmethod
    def get_connection_key(user_id: int, role: str) -> str:
        return f"{role}_{user_id}"


    async def _publish(self, payload: dict, external_redis: redis.Redis = None):
        """Helper function để publish lên Redis"""
        redis_client = external_redis or self.redis_pub or self.redis

        if not redis_client:
            logger.error("[SOCKET ERROR] No Redis connection found for publishing.")
            return

        try:
            await redis_client.publish("global_socket_channel", json.dumps(payload))
        except Exception as e:
            logger.error(f"[SOCKET ERROR] Failed to publish: {e}")

    async def send_to_user(self, message: dict, user_id: int, role: str, external_redis: redis.Redis = None):
        """Gửi tin cho 1 user cụ thể (Unicast)"""
        target_key = self.get_connection_key(user_id, role)
        payload = {
            "target_key": target_key,
            "message": message
        }
        await self._publish(payload, external_redis)

    async def broadcast_admin(self, message: dict | str, external_redis: redis.Redis = None):
        """
        Gửi tin cho TẤT CẢ Admin (Broadcast).
        Sử dụng target_key đặc biệt là 'BROADCAST_ADMIN'
        """
        payload = {
            "target_key": "BROADCAST_ADMIN",
            "message": message
        }
        await self._publish(payload, external_redis)
        logger.info(f"[SOCKET] Broadcast signal sent to Admin.")

    async def run_redis_listener(self):
        if not self.pubsub:
            logger.error("[SOCKET ERROR] Redis Sub not ready!")
            return

        await self.pubsub.subscribe("global_socket_channel")
        logger.info("[SOCKET] Redis Listener Started...")

        async for message in self.pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    target_key = data.get("target_key")
                    msg_content = data.get("message")

                    if target_key == "BROADCAST_ADMIN":
                        # Duyệt qua tất cả kết nối, tìm key bắt đầu bằng "admin_"
                        for conn_key, connections in self.active_connections.items():
                            if conn_key.startswith("admin_"):
                                for conn in connections:
                                    try:
                                        await conn.websocket.send_json(msg_content)
                                    except Exception:
                                        pass  # Socket có thể đã đóng

                    elif target_key in self.active_connections:
                        for connection in self.active_connections[target_key]:
                            try:
                                await connection.websocket.send_json(msg_content)
                            except Exception:
                                pass

                except Exception as e:
                    logger.error(f"[SOCKET] Listener Process Error: {e}")


socket_manager = SocketConnectionManager()