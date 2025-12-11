from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated
from datetime import datetime


PyObjectId = Annotated[str, BeforeValidator(str)]


class ReviewCreate(BaseModel):
    product_id: int
    order_id: int
    rating: int = Field(..., ge=1, le=5)
    content: Optional[str] = None
    images: List[str] = []


class ReviewReplyCreate(BaseModel):
    review_id: str
    reply_text: str


class ReviewReplyResponse(BaseModel):
    seller_id: int
    reply_text: str
    reply_date: datetime


class ReviewerResponse(BaseModel):
    id: int
    name: str
    avatar: Optional[str] = None


class ReviewResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    product_id: int
    order_id: int
    reviewer: ReviewerResponse
    rating: int
    review_text: Optional[str] = None
    images: List[str] = []
    replies: List[ReviewReplyResponse] = []
    created_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True