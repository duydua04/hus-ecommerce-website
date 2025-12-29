from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from typing import List, Any, Optional
from ...models.review import Review
from ...schemas.common import Page
from ...schemas.review import (
    ReviewResponse,
    ReviewCreate,
    ReviewUpdate,
    ReviewReplyResponse,
)
from ...services.buyer.buyer_review_service import (
    BuyerReviewService,
    get_buyer_review_service,
)
from ...config.s3 import public_url
from ...middleware.auth import get_current_user, require_buyer
from ...utils.storage import storage

router = APIRouter(
    prefix="/buyer/reviews",
    tags=["Buyer-Reviews"]
)

@router.get(
    "/product/{product_id}",
    response_model=Page
)
async def list_product_reviews(
    product_id: int,
    rating: int | None = Query(None, ge=1, le=5),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: BuyerReviewService = Depends(get_buyer_review_service),
):
    return await service.list_product_reviews(
        product_id=product_id,
        rating=rating,
        page=page,
        limit=limit,
    )

@router.get(
    "",
    response_model=Page,
)
async def list_my_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    info = Depends(get_current_user),
    service: BuyerReviewService = Depends(get_buyer_review_service)
):
    """
    Trả về tất cả review của người mua hiện tại, phân trang theo `page` và `limit`.
    """
    buyer_id = info["user"].buyer_id
    return await service.list_my_reviews(
        buyer_id=buyer_id,
        page=page,
        limit=limit
    )

@router.post("/upload")
async def upload_review_files(
    files: List[UploadFile] = File(...),
    info = Depends(get_current_user)
):
    results = await storage.upload_many("reviews", files, max_size_mb=50)

    return {
        "files": [
            {
                "object_key": r["object_key"],
                "public_url": public_url(r["object_key"]),
                "content_type": r["content_type"],
                "size": r["size"]
            }
            for r in results
        ]
    }

@router.post("/create", response_model=Review)
async def create_review(
    payload: ReviewCreate,
    service: BuyerReviewService = Depends(get_buyer_review_service),
    info: Any = Depends(get_current_user)
):
    return await service.create_review(buyer_id=info["user"].buyer_id, info=info, payload=payload)
@router.patch(
    "/{product_id}/{order_id}",
    response_model=ReviewResponse,
)
async def update_review(
    product_id: int,
    order_id: int,
    payload: ReviewUpdate,
    service: BuyerReviewService = Depends(get_buyer_review_service),
    info = Depends(get_current_user)
):
    return await service.update_review(
        buyer_id=info["user"].buyer_id,
        product_id=product_id,
        order_id=order_id,
        payload=payload
    )

@router.delete(
    "/{product_id}/{order_id}"
)
async def delete_review(
    product_id: int,
    order_id: int,
    service: BuyerReviewService = Depends(get_buyer_review_service),
    info = Depends(get_current_user)
):
    """
    API dùng để **xóa đánh giá của người mua** cho một sản phẩm.\n\n
        - Buyer chỉ có thể xóa review **của chính họ**.\n
        - Nếu `delete_files=True`, ảnh và video liên quan sẽ được xóa trên S3.\n\n
    Xóa review dựa theo product_id và order_id của người mua hiện tại.
    """
    return await service.delete_review(
        buyer_id=info["user"].buyer_id,
        product_id=product_id,
        order_id=order_id,
        delete_files=True  # nếu muốn xóa ảnh/video trên S3
    )

# @router.get(
#     "/{review_id}/replies",
#     response_model=List[ReviewReplyResponse],
#     summary="Xem phản hồi của shop",
#     description="Buyer xem phản hồi từ seller cho review."
# )
# async def get_review_replies(
#     review_id: str,
#     service: BuyerReviewService = Depends(get_buyer_review_service),
# ):
#     return await service.get_replies(review_id)



