from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Dict, Annotated
from datetime import datetime


PyObjectId = Annotated[str, BeforeValidator(str)]


class SendMessageRequest(BaseModel):
    recipient_id: int
    content: Optional[str] = None
    image_urls: List[str] = []
    conversation_id: Optional[str] = None


class ChatPartner(BaseModel):
    id: int
    name: str
    avatar: Optional[str] = None
    role: str  # 'buyer' hoặc 'seller'


class MessageResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    conversation_id: str
    sender: str  # 'buyer' hoặc 'seller'
    content: Optional[str] = None
    images: List[str] = []
    is_read: bool
    created_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True


class ConversationResponse(BaseModel):
    conversation_id: str
    last_message: Optional[str] = None
    last_message_at: datetime
    unread_counts: Dict[str, int] = {"buyer": 0, "seller": 0}
    partner: ChatPartner

    class Config:
        populate_by_name = True
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: List[MessageResponse]
    next_cursor: Optional[str] = None