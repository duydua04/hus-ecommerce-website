from typing import Dict, Any
from datetime import datetime
from beanie import Document
from pydantic import Field


class Notification(Document):
    recipient_id: int
    recipient_role: str
    title: str
    message: str
    event_type: str
    data: Dict[str, Any] = {}
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
        indexes = [
            [("recipient_id", 1), ("recipient_role", 1)],
            [("created_at", 1), {"expireAfterSeconds": 2592000}] # Tự xóa sau 30 ngày
        ]