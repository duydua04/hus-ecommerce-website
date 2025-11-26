from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime


class SendMessageRequest(BaseModel):
    recipient_id: int
    content: Optional[str] = None
    image_urls: List[str] = []
    conversation_id: Optional[int] = None


class MessageResponse(BaseModel):
    message_id: int
    sender: str
    content: Optional[str]
    images: List[str]
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: List[MessageResponse]
    next_cursor: Optional[str] = None  # Con tro moc thoi gian load trang tiep


class ConversationResponse(BaseModel):
    conversation_id: int
    buyer_id: int
    seller_id: int
    last_message: Optional[str]
    last_message_at: datetime
    unread_counts: Dict[str, int]

    class Config:
        from_attributes = True