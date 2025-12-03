import asyncio, logging, json
from typing import List, Any, Dict, Optional
from dataclasses import dataclass, field


logger = logging.getLogger("sse_manager")


@dataclass
class SseConnection:
    user_id: int
    role: str
    queue: asyncio.Queue = field(default_factory=asyncio.Queue)


class SSEManager:
    def __init__(self):
        self.active_connections : List[SseConnection] = []


    async def connect(self, user_id: int, role: str):
        # Tao ket noi moi
        connection = SseConnection(user_id, role)
        self.active_connections.append(connection)

        try:
            while True:
                message = await connection.queue.get()
                yield message
        except asyncio.CancelledError:
            logger.info(f"SSE User {role}_{user_id} disconnected")
        finally:
            self.active_connections.remove(connection)


    async def send_to_user(self, user_id: int, role: str, event: str, data: Dict[str, Any]):
        """
        Gửi cho MỘT người cụ thể
        """
        message = self._format_message(event, data)

        for conn in self.active_connections:
            if conn.user_id == user_id and conn.role == role:
                await conn.queue.put(message)


    async def broadcast_to_role(self, role: str, event: str, data: Dict[str, Any]):
        """
        Gửi cho TOÀN BỘ nhóm Role (VD: Báo User mới cho tất cả Admin)
        """
        message = self._format_message(event, data)

        for conn in self.active_connections:
            if conn.role == role:
                await conn.queue.put(message)


    async def broadcast_all(self, event: str, data: Dict[str, Any]):
        """
        Gửi cho TẤT CẢ mọi người đang online (VD: Thông báo bảo trì hệ thống)
        """
        message = self._format_message(event, data)

        for conn in self.active_connections:
            await conn.queue.put(message)


    def _format_message(self, event: str, data: Dict[str, Any]) -> dict:
        """Chuẩn hóa format trả về cho sse-starlette"""
        return {
            "event": event,  # Tên sự kiện để Frontend bắt (addEventListener)
            "data": json.dumps(data)  # Dữ liệu JSON string
        }


sse_manager = SSEManager()
