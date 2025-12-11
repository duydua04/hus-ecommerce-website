import json
from typing import Dict, List
from dataclasses import dataclass

import redis.asyncio as redis
from fastapi import WebSocket

from ..config.settings import settings


@dataclass
class WebSocketConnection:
    websocket: WebSocket


class SocketConnectionManager:
    """
    Quản lý tập trung kết nối WebSocket và cơ chế Pub/Sub qua Redis.
    """

    def __init__(self):
        # Lưu các socket đang kết nối trực tiếp tới Server này
        self.active_connections: Dict[str, List[WebSocketConnection]] = {}

        self.redis_pub: redis.Redis | None = None
        self.redis_sub: redis.Redis | None = None
        self.pubsub = None


    async def connect_redis(self):
        """Khởi tạo kết nối Redis khi ứng dụng khởi động"""
        self.redis_pub = redis.from_url(settings.redis_url_cache, decode_responses=True)
        self.redis_sub = redis.from_url(settings.redis_url_cache, decode_responses=True)
        self.pubsub = self.redis_sub.pubsub()


    async def close_redis(self):
        """Dọn dẹp kết nối khi ứng dụng tắt"""
        if self.pubsub: await self.pubsub.close()
        if self.redis_sub: await self.redis_sub.close()
        if self.redis_pub: await self.redis_pub.close()


    async def connect_socket(self, websocket: WebSocket, user_id: int, role: str):
        """Lưu kết nối socket vào RAM"""
        await websocket.accept()
        key = self.get_connection_key(user_id, role)

        if key not in self.active_connections:
            self.active_connections[key] = []

        self.active_connections[key].append(WebSocketConnection(websocket))


    def disconnect_socket(self, websocket: WebSocket, user_id: int, role: str):
        """Xóa kết nối socket khỏi RAM"""
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


    async def send_to_user(self, message: dict, user_id: int, role: str):
        """
        Hàm gửi tin. Publish lên Redis channel 'global_socket_channel'.
        """
        if not self.redis_pub:
            print("[SOCKET ERROR] Redis Pub not connected!")
            return

        target_key = self.get_connection_key(user_id, role)

        payload = {
            "target_key": target_key,
            "message": message
        }

        # Publish tin nhắn lên Redis
        await self.redis_pub.publish("global_socket_channel", json.dumps(payload))


    async def run_redis_listener(self):
        """
        Hàm lắng nghe tin nhắn từ Redis.
        Nhận tin từ Redis  kiểm tra user có ở server này không -> Gửi xuống socket.
        """
        if not self.pubsub:
            print("[SOCKET ERROR] Redis Sub not ready!")
            return

        await self.pubsub.subscribe("global_socket_channel")
        print("[SOCKET] Redis Listener Started...")

        async for message in self.pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    target_key = data["target_key"]
                    msg_content = data["message"]

                    # Kiểm tra xem User này có đang kết nối vào Server này khong
                    if target_key in self.active_connections:
                        # Nếu có, gửi tin qua WebSocket
                        for connection in self.active_connections[target_key]:
                            try:
                                await connection.websocket.send_json(msg_content)
                            except Exception as e:
                                print(f"[SOCKET] Send Error: {e}")
                except Exception as e:
                    print(f"[SOCKET] Process Error: {e}")


socket_manager = SocketConnectionManager()