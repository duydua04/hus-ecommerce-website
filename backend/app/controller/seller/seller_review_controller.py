from __future__ import annotations
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, Path, Body, status
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...middleware.auth import require_seller
from ...models.users import Seller
from ...schemas.common import Page
from ...schemas.review import ReviewReplyCreate, ReviewReplyResponse
from ...services.seller import seller_review_service

router = APIRouter(
    prefix="/seller/reviews",
    tags=["seller-reviews"],
    dependencies=Depends(require_seller)
)


@router.get("", response_model=Page)
def list_reviews_for_seller(
    product_id: Optional[int] = Query(None),
    rating_min: Optional[Decimal] = Query(None, ge=0, le=5),
    rating_max: Optional[Decimal] = Query(None, ge=0, le=5),
    delivered_only: bool = Query(True),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth = Depends(require_seller),
):
    seller: Seller = auth["user"]
    return seller_review_service.list_reviews_for_seller(
        db=db,
        seller=seller,
        product_id=product_id,
        rating_min=rating_min,
        rating_max=rating_max,
        delivered_only=delivered_only,
        limit=limit,
        offset=offset,
    )


@router.post("/{review_id}/replies", response_model=ReviewReplyResponse, status_code=status.HTTP_201_CREATED)
def reply_review(
    review_id: int = Path(..., ge=1),
    body: ReviewReplyCreate = Body(...),
    db: Session = Depends(get_db),
    auth = Depends(require_seller),
):
    seller: Seller = auth["user"]
    payload = ReviewReplyCreate(review_id=review_id, seller_id=seller.seller_id, reply_text=body.reply_text)
    return seller_review_service.create_reply_for_review(db, payload, seller)


@router.get("/{review_id}/replies", response_model=List[ReviewReplyResponse])
def list_replies(
    review_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
):
    return seller_review_service.list_replies(db, review_id)
