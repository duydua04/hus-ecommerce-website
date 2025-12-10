from typing import Dict
from fastapi import WebSocket

# Class cha mô tả quản lý các kết nối websocket
class BaseConnectionManager:

    # Khoi tao voi active connection la dict, cac key la chuoi the hien role va id, value la doi tuong websocket
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}


    async def connect(self, websocket: WebSocket, user_id: int, role: str):
        # Thuc hien ket noi
        await websocket.accept()
        key = f"{role}_{user_id}"
        self.active_connections[key] = websocket


    def disconnect(self, user_id: int, role: str):
        # Thuc hien ngat ket noi
        key = f"{role}_{user_id}"
        if key in self.active_connections:
            del self.active_connections[key]

    def get_connection_key(self, user_id: int, role: str) -> str:
        """Tạo connection key từ user_id và role"""
        return f"{role}_{user_id}"


    async def _send_message(self, key: str, message: dict):
        # Ham thuc hien ban tin nhan toi client
        if key in self.active_connections:
            try:
                await self.active_connections[key].send_json(message)
                return True
            except Exception:
                del self.active_connections[key]
        return False
