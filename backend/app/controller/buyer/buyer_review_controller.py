from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from typing import List, Any
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

# @router.get(
#     "/product/{product_id}",
#     response_model=Page,
#     summary="Danh sách review của sản phẩm",
#     description="Lấy danh sách đánh giá của một sản phẩm, có phân trang và lọc rating."
# )
# async def list_product_reviews(
#     product_id: int,
#     rating: int | None = Query(None, ge=1, le=5),
#     page: int = Query(1, ge=1),
#     limit: int = Query(10, ge=1, le=50),
#     service: BuyerReviewService = Depends(get_buyer_review_service),
# ):
#     return await service.list_product_reviews(
#         product_id=product_id,
#         rating=rating,
#         page=page,
#         limit=limit,
#     )

# @router.get(
#     "/me",
#     response_model=Page,
#     summary="Danh sách review của tôi",
#     description="Buyer xem các review mà mình đã đánh giá."
# )
# async def list_my_reviews(
#     page: int = Query(1, ge=1),
#     limit: int = Query(10, ge=1, le=50),
#     buyer=Depends(require_buyer),
#     service: BuyerReviewService = Depends(get_buyer_review_service),
# ):
#     return await service.list_my_reviews(
#         buyer_id=buyer["user"].buyer_id,
#         page=page,
#         limit=limit,
#     )
@router.post("/reviews/upload")
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

@router.post("", response_model=Review)
async def create_review(
    payload: ReviewCreate,
    service: BuyerReviewService = Depends(get_buyer_review_service),
    info: Any = Depends(get_current_user)
):
    return await service.create_review(buyer_id=info["user"].buyer_id, info=info, payload=payload)
# @router.put(
#     "/{review_id}",
#     response_model=ReviewResponse,
#     summary="Cập nhật review",
#     description="Buyer chỉnh sửa review của chính mình."
# )
# async def update_review(
#     review_id: str,
#     payload: ReviewUpdate,
#     buyer=Depends(require_buyer),
#     service: BuyerReviewService = Depends(get_buyer_review_service),
# ):
#     return await service.update_review(
#         buyer_id=buyer["user"].buyer_id,
#         review_id=review_id,
#         payload=payload,
#     )

# @router.delete(
#     "/{review_id}",
#     status_code=status.HTTP_204_NO_CONTENT,
#     summary="Xoá review",
#     description="Buyer xoá review của chính mình."
# )
# async def delete_review(
#     review_id: str,
#     buyer=Depends(require_buyer),
#     service: BuyerReviewService = Depends(get_buyer_review_service),
# ):
#     await service.delete_review(
#         buyer_id=buyer["user"].buyer_id,
#         review_id=review_id,
#     )

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



