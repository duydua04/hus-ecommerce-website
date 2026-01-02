from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
# Đảm bảo bạn import đúng middleware cho seller
from ...middleware.auth import require_seller 
from ...services.common.notification_service import notification_service

router = APIRouter(
    prefix="/seller/notifications",
    tags=["seller-notifications"],
)


@router.get("/")
async def get_seller_notifications(
        limit: int = Query(20, ge=1, le=100),
        cursor: Optional[str] = Query(None),
        unread_only: bool = Query(False),
        seller_info: dict = Depends(require_seller)
):
    """
    API lấy danh sách thông báo dành cho Người bán
    """
    # Lấy thông tin user từ middleware (thường là bảng Seller hoặc User có role seller)
    user = seller_info['user']

    return await notification_service.get_notifications(
        user_id=user.seller_id, # Đổi thành seller_id
        role="seller",           # Đổi role thành seller
        limit=limit,
        cursor=cursor,
        unread_only=unread_only
    )


@router.put("/{notif_id}/read")
async def mark_seller_notification_read(
        notif_id: str,
        seller_info: dict = Depends(require_seller)
):
    """
    Người bán đánh dấu đã đọc một thông báo
    """
    user = seller_info['user']

    # Truyền user.seller_id để đảm bảo seller chỉ đọc được thông báo của chính mình
    success = await notification_service.mark_as_read(notif_id, user.seller_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Thông báo không tồn tại hoặc không thuộc quyền sở hữu của bạn"
        )

    return {"message": "Đã đánh dấu đã đọc"}


@router.put("/read-all")
async def mark_all_seller_notifications_read(
    seller_info: dict = Depends(require_seller)
):
    """
    API bổ sung: Đánh dấu đã đọc tất cả thông báo của Seller
    """
    user = seller_info['user']
    await notification_service.mark_all_as_read(user.seller_id, role="seller")
    return {"message": "Đã đánh dấu đã đọc tất cả thông báo"}