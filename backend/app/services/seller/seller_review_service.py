from __future__ import annotations
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..common.review_common_service import BaseReviewService
from ...config.db import get_db
from ...models.review import Review, ReviewReply
from ...models.catalog import Product
from ...schemas.review import ReviewReplyCreate


class SellerReviewService(BaseReviewService):

    def __init__(self, db: AsyncSession):
        super().__init__(db)


    async def list_my_reviews(
            self,
            seller_id: int,
            product_name: str | None = None,
            rating: int | None = None,
            page: int = 1, limit: int = 10
    ):
        """Lấy danh sách review của shop mình"""

        # 1. Tạo Query cơ bản với Beanie (Mongo)
        query = Review.find(Review.seller_id == seller_id)

        # Lọc theo tên SP
        if product_name:
            stmt = select(Product.product_id).where(
                Product.seller_id == seller_id,
                Product.name.ilike(f"%{product_name}%")
            )
            result = await self.db.execute(stmt)
            p_ids = result.scalars().all()

            if not p_ids:
                return self._paginate([], 0, limit, 0)

            query = query.find({"product_id": {"$in": p_ids}})

        # Lọc theo Rating
        if rating:
            query = query.find(Review.rating == rating)

        # Phân trang & Execute
        offset = (page - 1) * limit

        # Đếm tổng
        total = await query.count()

        # Lấy danh sách (Sort mới nhất trước)
        items = await query.sort("-created_at").skip(offset).limit(limit).to_list()

        page_result = self._paginate(items, total, limit, offset)

        if items:
            current_p_ids = list({item.product_id for item in items})

            if current_p_ids:
                stmt_name = select(Product.product_id, Product.name).where(
                    Product.product_id.in_(current_p_ids)
                )
                res_name = await self.db.execute(stmt_name)
                product_map = {pid: name for pid, name in res_name.all()}

                for review_resp in page_result.data:
                    review_resp.product_name = product_map.get(review_resp.product_id)

        return page_result


    async def reply_review(self, seller_id: int, payload: ReviewReplyCreate):
        """Trả lời đánh giá"""
        review = await self._get_review_or_404(payload.review_id)

        if review.seller_id != seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this product review"
            )

        reply = ReviewReply(
            seller_id=seller_id,
            reply_text=payload.reply_text
        )

        review.replies.append(reply)

        await review.save()

        return reply


def get_seller_review_service(db: AsyncSession = Depends(get_db)):
    return SellerReviewService(db)