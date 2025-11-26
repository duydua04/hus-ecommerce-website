from .socket_manager import BaseConnectionManager

class ChatConnectionManager(BaseConnectionManager):
    def __init__(self):
        super().__init__()

    async def send_personal_message(self, message: dict, user_id: int, role: str):
        key = self.get_connection_key(user_id, role)
        await self._send_message(key, message)

chat_manager = ChatConnectionManager()