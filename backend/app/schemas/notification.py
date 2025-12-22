from pydantic import BaseModel, Field, BeforeValidator
from typing import Dict, Any, Annotated, List, Optional
from datetime import datetime


PyObjectId = Annotated[str, BeforeValidator(str)]

class NotificationResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    recipient_id: int
    recipient_role: str
    title: str
    message: str
    event_type: str
    data: Dict[str, Any] = {}
    is_read: bool
    created_at: datetime

    class Config:
        populate_by_name = True  # Cho phép map theo tên field hoặc alias
        from_attributes = True  # Cho phép đọc dữ liệu từ Object (ORM mode)

class NotificationCursorPage(BaseModel):
    items: List
    next_cursor: Optional[str] = None
    has_more: bool = False