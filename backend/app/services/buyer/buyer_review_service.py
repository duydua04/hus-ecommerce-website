from __future__ import annotations
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from ...models.order import Order
from ...config.s3 import public_url

from ..common.review_common_service import BaseReviewService
from ...config.db import get_db
from ...models.review import Review, ReviewerSnapshot
from ...models.catalog import Product
from ...schemas.review import (
    ReviewCreate,
    ReviewUpdate
)

class BuyerReviewService(BaseReviewService):

    def __init__(self, db: AsyncSession):
        super().__init__(db)

    # # ===================== DANH SÁCH REVIEW CỦA 1 SẢN PHẨM =====================
    # async def list_product_reviews(
    #     self,
    #     product_id: int,
    #     rating: int | None = None,
    #     page: int = 1,
    #     limit: int = 10,
    # ):
    #     query = Review.find(Review.product_id == product_id)

    #     if rating:
    #         query = query.find(Review.rating == rating)

    #     offset = (page - 1) * limit
    #     total = await query.count()

    #     items = (
    #         await query
    #         .sort("-created_at")
    #         .skip(offset)
    #         .limit(limit)
    #         .to_list()
    #     )

    #     return self._paginate(items, total, limit, offset)

    # # ===================== REVIEW CỦA CHÍNH BUYER =====================
    # async def list_my_reviews(
    #     self,
    #     buyer_id: int,
    #     page: int = 1,
    #     limit: int = 10,
    # ):
    #     query = Review.find(Review.buyer_id == buyer_id)

    #     offset = (page - 1) * limit
    #     total = await query.count()

    #     items = (
    #         await query
    #         .sort("-created_at")
    #         .skip(offset)
    #         .limit(limit)
    #         .to_list()
    #     )

    #     return self._paginate(items, total, limit, offset)

    # ===================== TẠO REVIEW =====================
    async def create_review(self, buyer_id: int, info, payload: ReviewCreate):
        # Check đã review chưa
        existed = await Review.find_one(
            Review.buyer_id == buyer_id,
            Review.order_id == payload.order_id,
            Review.product_id == payload.product_id
        )
        if existed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already reviewed this product"
            )

        # Lấy seller_id từ Product (SQL)
        stmt = select(Product.seller_id).where(Product.product_id == payload.product_id)
        result = await self.db.execute(stmt)
        seller_id = result.scalar_one_or_none()

        if not seller_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Tạo reviewer snapshot
        reviewer_snapshot = ReviewerSnapshot(
            id=info["user"].buyer_id,
            name=info["user"].lname + " " + info["user"].fname,
            avatar=getattr(info["user"], "avt_url", None)  # nếu có avatar
        )

        # Tạo Review
        review = Review(
            product_id=payload.product_id,
            order_id=payload.order_id,
            seller_id=seller_id,
            buyer_id=buyer_id,
            reviewer=reviewer_snapshot,
            rating=payload.rating,
            review_text=payload.content or "",
            images=payload.images,
            videos=payload.videos
        )

        await review.insert()
        return review
    # # ===================== CẬP NHẬT REVIEW =====================
    # async def update_review(
    #     self,
    #     buyer_id: int,
    #     review_id: str,
    #     payload: ReviewUpdate,
    # ):
    #     review = await self._get_review_or_404(review_id)

    #     if review.buyer_id != buyer_id:
    #         raise HTTPException(
    #             status_code=status.HTTP_403_FORBIDDEN,
    #             detail="You do not own this review"
    #         )

    #     review.rating = payload.rating
    #     review.comment = payload.comment

    #     await review.save()
    #     return review

    # # ===================== XOÁ REVIEW =====================
    # async def delete_review(
    #     self,
    #     buyer_id: int,
    #     review_id: str,
    # ):
    #     review = await self._get_review_or_404(review_id)

    #     if review.buyer_id != buyer_id:
    #         raise HTTPException(
    #             status_code=status.HTTP_403_FORBIDDEN,
    #             detail="You do not own this review"
    #         )

    #     await review.delete()

def get_buyer_review_service(
    db: AsyncSession = Depends(get_db),
):
    return BuyerReviewService(db)
