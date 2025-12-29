from typing import List, Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING, DESCENDING


class ReviewReply(BaseModel):
    seller_id: int
    reply_text: str
    reply_date: datetime = Field(default_factory=datetime.utcnow)


class ReviewerSnapshot(BaseModel):
    id: int
    name: str
    avatar: Optional[str] = None


class Review(Document):
    product_id: int
    order_id: int
    seller_id: int
    buyer_id: int

    reviewer: ReviewerSnapshot

    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None
    images: List[str] = []  # Mảng URL ảnh
    videos: List[str] = []  # object_key của video
    replies: List[ReviewReply] = []

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reviews"
        indexes = [
            IndexModel(
                [("product_id", ASCENDING), ("created_at", DESCENDING)]
            ),
            IndexModel(
                [("seller_id", ASCENDING), ("created_at", DESCENDING)]
            ),
            IndexModel(
                [("order_id", ASCENDING), ("product_id", ASCENDING)],
                unique=True
            )
        ]