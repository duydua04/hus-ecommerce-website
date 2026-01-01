from pydantic import BaseModel, Field, BeforeValidator, field_validator
from typing import List, Optional, Annotated
from datetime import datetime
from ..config.s3 import public_url

PyObjectId = Annotated[str, BeforeValidator(str)]


class ReviewCreate(BaseModel):
    product_id: int
    order_id: int
    rating: int = Field(..., ge=1, le=5)
    content: Optional[str] = None
    images: List[str] = []
    videos: list[str] = []   # object_key


class ReviewReplyCreate(BaseModel):
    review_id: str
    reply_text: str


class ReviewReplyResponse(BaseModel):
    seller_id: int
    reply_text: str
    reply_date: datetime

    class Config:
        from_attributes = True

class ReviewerResponse(BaseModel):
    id: int
    name: str
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

    @field_validator("avatar")
    @classmethod
    def transform_avatar_url(cls, v: str | None) -> str | None:
        if v:
            return public_url(v)
        return v


class ReviewResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    product_id: int
    order_id: int
    reviewer: ReviewerResponse
    rating: int
    review_text: Optional[str] = None
    images: List[str] = []
    videos: List[str] = []
    replies: List[ReviewReplyResponse] = []
    created_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True

class ReviewUpdate(BaseModel):
    """
    Schema cập nhật review (buyer)
    """
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, min_length=1)

class ReviewMediaItem(BaseModel):
    review_id: str
    product_id: int
    buyer_id: int
    rating: int
    created_at: datetime
    images: List[str] = []
    videos: List[str] = []

    