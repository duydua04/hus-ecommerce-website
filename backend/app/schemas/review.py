# app/schemas/review.py
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field
from .common import ORMBase

# (Request)
class ReviewCreate(BaseModel):
    product_id: int
    buyer_id: int
    order_id: int
    review_text: str | None = None
    rating: Decimal = Field(..., ge=0, le=5)  # numeric(2,1)
    is_verified: bool | None = None  # backend sẽ set/validate thực tế

# (Request)
class ReviewUpdate(BaseModel):
    review_text: str | None = None
    rating: Decimal | None = Field(None, ge=0, le=5)

# (Response)
class ReviewResponse(ORMBase):
    review_id: int
    product_id: int
    buyer_id: int
    order_id: int
    review_text: str | None = None
    rating: float
    is_verified: bool
    review_date: datetime | None = None

# (Request) — confirm sau khi FE PUT ảnh review lên MinIO
class ReviewImageCreate(BaseModel):
    review_id: int
    image_url: str  # object_key

# (Response)
class ReviewImageResponse(ORMBase):
    review_image_id: int
    review_id: int
    image_url: str
    public_url: str | None = None
    presigned_get_url: str | None = None

# (Request)
class ReviewReplyCreate(BaseModel):
    review_id: int
    seller_id: int
    reply_text: str

# (Response)
class ReviewReplyResponse(ORMBase):
    review_reply_id: int
    review_id: int
    seller_id: int
    reply_text: str
    reply_date: datetime | None = None
