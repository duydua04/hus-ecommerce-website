from __future__ import annotations
from typing import List, Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from ...schemas.common import Page
from ...models.order import Order
from ...config.s3 import public_url
from ...utils.storage import storage  # import S3Storage instance
from ..common.review_common_service import BaseReviewService
from ...config.db import get_db
from ...models.review import Review, ReviewerSnapshot
from ...models.catalog import Product
from ...schemas.review import (
    ReviewCreate,
    ReviewMediaItem,
    ReviewReplyResponse,
    ReviewUpdate,
    ReviewerResponse
)

class BuyerReviewService(BaseReviewService):

    def __init__(self, db: AsyncSession):
        super().__init__(db)

    # # ===================== DANH SÁCH REVIEW CỦA 1 SẢN PHẨM =====================
    async def list_product_reviews(
        self,
        product_id: int,
        rating: int | None = None,
        page: int = 1,
        limit: int = 10,
    ):
        query = Review.find(Review.product_id == product_id)

        if rating:
            query = query.find(Review.rating == rating)

        # Phân trang
        offset = (page - 1) * limit
        total = await query.count()
        items = await query.sort("-created_at").skip(offset).limit(limit).to_list()

        for item in items:
            # convert reviewer
            if isinstance(item.reviewer, ReviewerSnapshot):
                item.reviewer = ReviewerResponse(
                    id=item.reviewer.id,
                    name=item.reviewer.name,
                    avatar=item.reviewer.avatar
                )

            # convert replies
            if hasattr(item, "replies") and item.replies:
                converted_replies = []
                for reply in item.replies:
                    converted_replies.append(
                        ReviewReplyResponse(
                            seller_id=reply.seller_id,
                            reply_text=reply.reply_text,    # đúng tên field
                            reply_date=reply.reply_date     # đúng tên field
                        )
                    )
                item.replies = converted_replies

        return self._paginate(items, total, limit, offset)

    # # ===================== REVIEW CỦA CHÍNH BUYER =====================
    async def list_my_reviews(
        self,
        buyer_id: int,
        page: int = 1,
        limit: int = 10,
    ) -> Page:
        """
        Lấy danh sách review của chính buyer
        """

        # Build query cơ bản
        query = Review.find(Review.buyer_id == buyer_id)


        # Phân trang
        offset = (page - 1) * limit
        total = await query.count()
        items = await query.sort("-created_at").skip(offset).limit(limit).to_list()

        for item in items:
            # convert reviewer
            if isinstance(item.reviewer, ReviewerSnapshot):
                item.reviewer = ReviewerResponse(
                    id=item.reviewer.id,
                    name=item.reviewer.name,
                    avatar=item.reviewer.avatar
                )

            # convert replies
            if hasattr(item, "replies") and item.replies:
                converted_replies = []
                for reply in item.replies:
                    converted_replies.append(
                        ReviewReplyResponse(
                            seller_id=reply.seller_id,
                            reply_text=reply.reply_text,    # đúng tên field
                            reply_date=reply.reply_date     # đúng tên field
                        )
                    )
                item.replies = converted_replies

        return self._paginate(items, total, limit, offset)

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
    async def update_review(
        self,
        buyer_id: int,
        product_id: int,
        order_id: int,
        payload: ReviewUpdate
    ):
        # 1. Lấy review
        review = await Review.find_one(
            Review.buyer_id == buyer_id,
            Review.product_id == product_id,
            Review.order_id == order_id
        )
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )

        # 2. Update các trường nếu FE gửi
        if payload.rating is not None:
            review.rating = payload.rating
        if payload.comment is not None:
            review.review_text = payload.comment

        # 3. Lưu thay đổi vào MongoDB
        await review.save()
        return review

    # # ===================== XOÁ REVIEW =====================
    async def delete_review(
        self,
        buyer_id: int,
        product_id: int,
        order_id: int,
        delete_files: bool = False
    ):
        # 1. Lấy review
        review = await Review.find_one(
            Review.buyer_id == buyer_id,
            Review.product_id == product_id,
            Review.order_id == order_id
        )
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )

        # 2. Xóa file trên S3 nếu cần
        if delete_files:
            files_to_delete: List[str] = review.images + review.videos
            for key in files_to_delete:
                storage.delete_file(key)

        # 3. Xóa review MongoDB
        await review.delete()
        return {"deleted": True, "review_id": str(review.id)}

    # ===================== MEDIA REVIEW (ẢNH + VIDEO) =====================
    async def list_all_review_media(self):
        """
        Lấy toàn bộ ảnh + video review của tất cả sản phẩm
        FE tự random kết quả
        """

        query = Review.find(
            {
                "$or": [
                    {"images": {"$exists": True, "$ne": []}},
                    {"videos": {"$exists": True, "$ne": []}},
                ]
            }
        )

        items = await query.sort("-created_at").limit(50).to_list()

        results = []
        for r in items:
            results.append(
                ReviewMediaItem(
                    review_id=str(r.id),
                    product_id=r.product_id,
                    buyer_id=r.buyer_id,
                    rating=r.rating,
                    created_at=r.created_at,
                    images=[public_url(i) for i in (r.images or [])],
                    videos=[public_url(v) for v in (r.videos or [])],
                )
            )

        return results

def get_buyer_review_service(
    db: AsyncSession = Depends(get_db),
):
    return BuyerReviewService(db)
