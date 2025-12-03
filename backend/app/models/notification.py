from typing import Dict, Any
from datetime import datetime
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING


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
            IndexModel([("recipient_id", ASCENDING), ("recipient_role", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)], expireAfterSeconds=2592000)
        ]