from __future__ import annotations
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from ...models.users import Seller
from ...models.catalog import Product
from ...models.order import Order
from ...models.review import Review, ReviewReply
from ...schemas.common import Page
from ...schemas.review import ReviewReplyCreate, ReviewReplyResponse
from ...services.common.review_common_service import (
    page, review_to_response, reply_to_response
)


def list_reviews_for_seller(
    db: Session,
    seller: Seller,
    product_name: Optional[str] = None,
    rating_min: Optional[Decimal] = None,
    rating_max: Optional[Decimal] = None,
    delivered_only: bool = True,
    limit: int = 10,
    offset: int = 0,
) :

    """
    Lay danh sach danh gia san pham cho seller kem theo bo loc
    """
    q = (
        db.query(Review)
        .join(Product, Product.product_id == Review.product_id)
        .filter(Product.seller_id == seller.seller_id)
    )

    if product_name:
        s = product_name.strip()
        q = q.filter(Product.name.ilike(f"%{s}%"))

    if rating_min is not None:
        q = q.filter(Review.rating >= rating_min)

    if rating_max is not None:
        q = q.filter(Review.rating <= rating_max)

    if delivered_only:
        q = q.join(Order, Order.order_id == Review.order_id).filter(Order.order_status == "delivered")

    total = q.count()
    items = (
        q.options(joinedload(Review.replies))
        .order_by(Review.review_date.desc())
        .limit(limit).offset(offset).all()
    )
    data = [review_to_response(r) for r in items]
    return page(total, limit, offset, data)


def create_reply_for_review(db: Session, payload: ReviewReplyCreate, seller: Seller):
    """Tao phan hoi cua seller cho 1 reiview cua san pham cua minh"""
    review = db.query(Review).filter(Review.review_id == payload.review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found."
        )

    prod = db.query(Product).filter(Product.product_id == review.product_id).first()
    if not prod or prod.seller_id != seller.seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reply to reviews of your products."
        )

    reply = ReviewReply(
        review_id=review.review_id,
        seller_id=seller.seller_id,
        reply_text=payload.reply_text
    )

    db.add(reply)
    db.commit()
    db.refresh(reply)

    return reply_to_response(reply)


def list_replies(db: Session, review_id: int):
    """Lay danh sach tat ca phan hoi cua review"""
    reps = db.query(ReviewReply).filter(ReviewReply.review_id == review_id).order_by(ReviewReply.reply_date.asc()).all()
    return [reply_to_response(r) for r in reps]
