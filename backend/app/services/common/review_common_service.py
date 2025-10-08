from __future__ import annotations
from decimal import Decimal
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from ...models.catalog import Product
from ...models.order import Order, OrderItem
from ...models.review import Review, ReviewImage, ReviewReply
from ...schemas.common import Page, PageMeta
from ...schemas.review import (
    ReviewResponse, ReviewImageResponse, ReviewReplyResponse
)
from ...config.s3 import public_url as s3_public_url, presign_get as s3_presign_get


def page(total: int, limit: int, offset: int, data: list):
    return Page(meta=PageMeta(total=total, limit=limit, offset=offset), data=data)


def review_to_response(r: Review):
    return ReviewResponse.model_validate(r)


def image_to_response(img: ReviewImage):
    resp = ReviewImageResponse.model_validate(img)
    # Có thể tắt 1 trong 2 dòng nếu bucket private/public theo môi trường thực tế của bạn
    resp.public_url = s3_public_url(img.image_url)
    resp.presigned_get_url = s3_presign_get(img.image_url)
    return resp


def reply_to_response(rep: ReviewReply):
    return ReviewReplyResponse.model_validate(rep)


def recalc_product_rating(db: Session, product_id: int):
    """Tính lại avg rating (1 chữ số thập phân) & review_count cho Product."""
    avg_, cnt = (
        db.query(func.coalesce(func.avg(Review.rating), 0), func.count(Review.review_id))
        .filter(Review.product_id == product_id)
        .first()
    )
    avg_dec = Decimal(str(avg_ or 0)).quantize(Decimal("0.1"))

    prod = db.query(Product).filter(Product.product_id == product_id).first()
    if prod:
        prod.rating = avg_dec
        prod.review_count = int(cnt or 0)
        db.add(prod)
        db.commit()


def ensure_order_delivered_contains_product(
        db: Session,
        order_id: int,
        buyer_id: int,
        product_id: int
):
    """Kiểm tra đơn thuộc buyer, đã giao (delivered) và có chứa product."""
    ok = (
        db.query(Order.order_id)
        .filter(
            Order.order_id == order_id,
            Order.buyer_id == buyer_id,
            Order.order_status == "delivered",
        ).first()
        is not None
    )
    if not ok:
        return False

    has_product = (
        db.query(OrderItem.order_item_id)
        .filter(OrderItem.order_id == order_id, OrderItem.product_id == product_id)
        .first()
        is not None
    )
    return has_product
