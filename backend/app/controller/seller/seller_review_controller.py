from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, Body, status

from ...middleware.auth import require_seller
from ...schemas.common import Page
from ...schemas.review import ReviewReplyCreate, ReviewReplyResponse

from ...services.seller.seller_review_service import (
    SellerReviewService,
    get_seller_review_service
)

router = APIRouter(
    prefix="/seller/reviews",
    tags=["seller-reviews"],
)


@router.get("", response_model=Page)
async def list_reviews_for_seller(
        product_name: Optional[str] = Query(None, description="Lọc theo tên sản phẩm"),
        rating: Optional[int] = Query(None, ge=1, le=5, description="Lọc theo số sao"),
        page: int = Query(1, ge=1),
        limit: int = Query(10, ge=1, le=100),
        seller_info=Depends(require_seller),
        service: SellerReviewService = Depends(get_seller_review_service)
):
    """
    Lấy danh sách đánh giá của Shop.
    """
    seller_id = seller_info["user"].seller_id

    return await service.list_my_reviews(
        seller_id=seller_id,
        product_name=product_name,
        rating=rating,
        page=page,
        limit=limit
    )


@router.post("/{review_id}/replies", response_model=ReviewReplyResponse, status_code=status.HTTP_201_CREATED)
async def reply_review(
        review_id: str = Path(..., description="ID của Review (MongoDB ObjectId)"),
        reply_text: str = Body(..., embed=True),
        seller_info=Depends(require_seller),
        service: SellerReviewService = Depends(get_seller_review_service)
):
    """
    Tạo phản hồi cho đánh giá.
    """
    seller_id = seller_info["user"].seller_id

    payload = ReviewReplyCreate(
        review_id=review_id,
        reply_text=reply_text
    )

    return await service.reply_review(
        seller_id=seller_id,
        payload=payload
    )


@router.get("/{review_id}/replies", response_model=List[ReviewReplyResponse], dependencies=[Depends(require_seller)])
async def list_replies(
        review_id: str = Path(...),
        service: SellerReviewService = Depends(get_seller_review_service)
):
    """
    Xem danh sách phản hồi của một đánh giá.
    """
    return await service.get_replies(review_id)