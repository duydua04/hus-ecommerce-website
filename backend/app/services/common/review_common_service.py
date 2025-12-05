from __future__ import annotations
from typing import List
from abc import ABC

from fastapi import HTTPException, status
from beanie import PydanticObjectId
from sqlalchemy.orm import Session

from ...models import Review
from ...schemas.common import Page, PageMeta
from ...schemas.review import ReviewResponse, ReviewReplyResponse


class BaseReviewService(ABC):

    def __init__(self, db: Session):
        self.db = db


    @staticmethod
    def _paginate(items: List[Review], total: int, limit: int, offset: int):
        data = [ReviewResponse.model_validate(item) for item in items]
        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )


    @staticmethod
    async def _get_review_or_404(review_id: str):
        try:
            review = await Review.get(PydanticObjectId(review_id))
        except:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid Review ID format"
            )

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )

        return review


    async def get_replies(self, review_id: str):
        """
        Lấy danh sách phản hồi của một Review.
        """
        # 1. Tìm Review (Sẽ báo lỗi 404 nếu ID không đúng)
        review = await self._get_review_or_404(review_id)

        return [ReviewReplyResponse.model_validate(r) for r in review.replies]