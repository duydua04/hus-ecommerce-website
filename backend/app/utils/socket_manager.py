from dataclasses import dataclass
from typing import Dict, List
from fastapi import WebSocket

@dataclass
class WebSocketConnection:
    websocket : WebSocket

# Class cha mô tả quản lý các kết nối websocket
class BaseConnectionManager:

    # Khoi tao voi active connection
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocketConnection]] = {}


    async def connect(self, websocket: WebSocket, user_id: int, role: str):
        # Thuc hien ket noi
        await websocket.accept()
        key = self.get_connection_key(user_id, role)
        if key not in self.active_connections:
            self.active_connections[key] = []

        self.active_connections[key].append(WebSocketConnection(websocket))


    def disconnect(self, websocket: WebSocket, user_id: int, role: str):
        # Thuc hien ngat ket noi
        key = self.get_connection_key(user_id, role)

        # Loc bo cac socket vua ngat ket noi, giu lai cac socket khac
        if key in self.active_connections:
            self.active_connections[key] = [connection for connection in self.active_connections[key] if connection.websocket != websocket]

    def get_connection_key(self, user_id: int, role: str) -> str:
        """Tạo connection key từ user_id và role"""
        return f"{role}_{user_id}"


    async def _send_message(self, key: str, message: dict):
        # Ham thuc hien ban tin nhan toi client
        if key in self.active_connections:
            connections = self.active_connections[key]

            for connection in connections:
                try:
                    await connection.websocket.send_json(message)
                except Exception:
                    print("Error")
            return True
        return False
