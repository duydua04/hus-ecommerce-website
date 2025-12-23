from typing import Optional, List, Dict
from datetime import datetime
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING

class Conversation(Document):
    buyer_id: int
    seller_id: int
    last_message: Optional[str] = None
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    unread_counts: Dict[str, int] = {"buyer": 0, "seller": 0}

    class Settings:
        name = "conversations"
        indexes = [
            IndexModel([("buyer_id", ASCENDING), ("seller_id", ASCENDING)], unique=True),
            IndexModel([("last_message_at", DESCENDING)])
        ]

class Message(Document):
    conversation_id: str
    sender: str
    content: Optional[str] = None
    images: List[str] = []
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "messages"
        indexes = [
            IndexModel([("conversation_id", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)])
        ]