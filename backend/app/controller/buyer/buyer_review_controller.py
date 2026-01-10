from fastapi import APIRouter, Depends, File, Query, UploadFile, status, BackgroundTasks
from typing import List, Any, Optional
from ...models.review import Review
from ...schemas.common import Page
from ...schemas.review import (
    ReviewMediaItem,
    ReviewResponse,
    ReviewCreate,
    ReviewUpdate,
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

# ===================== MEDIA =====================
@router.get(
    "/media",
    response_model=list[ReviewMediaItem]
)
async def list_review_media(
    service: BuyerReviewService = Depends(get_buyer_review_service),
):
    """
    **Bộ sưu tập hình ảnh và video từ tất cả đánh giá.**

    API này giúp khách hàng xem nhanh các hình ảnh thực tế của sản phẩm từ cộng đồng người mua.
    """
    return await service.list_all_review_media()


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
    """
    **Xem danh sách đánh giá của một sản phẩm cụ thể.**

    ### Tham số:
    - **product_id**: ID của sản phẩm cần xem.
    - **rating**: Lọc theo số sao (1-5). Để trống nếu muốn xem tất cả.
    - **page/limit**: Phân trang dữ liệu.
    """
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
    **Xem lại các đánh giá tôi đã viết.**

    Giúp người mua quản lý lịch sử đánh giá sản phẩm của chính họ.
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
    """
    **Tải lên ảnh/video để đính kèm vào đánh giá.**

    ### Quy trình:
    1. Gọi API này để tải file lên hệ thống lưu trữ (S3).
    2. Nhận lại `object_key` và `public_url`.
    3. Sử dụng `object_key` này để truyền vào mảng `media` trong API **Create Review**.

    """
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
    bg_tasks: BackgroundTasks, # Inject BackgroundTasks vào đây
    service: BuyerReviewService = Depends(get_buyer_review_service),
    info: Any = Depends(get_current_user)
):
    """
    **Viết đánh giá mới cho sản phẩm.**

    ### Điều kiện:
    - Người mua phải **đã mua và nhận hàng thành công** sản phẩm đó (xác thực qua `order_id`).

    """
    # Truyền bg_tasks xuống hàm service
    return await service.create_review(
        buyer_id=info["user"].buyer_id, 
        info=info, 
        payload=payload, 
        bg_tasks=bg_tasks
    )

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
    """
    **Chỉnh sửa nội dung đánh giá.**

    Người dùng có thể sửa đổi nội dung văn bản hoặc số sao đã đánh giá trước đó.
    """
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



