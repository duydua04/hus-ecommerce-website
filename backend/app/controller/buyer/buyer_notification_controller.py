from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from ...middleware.auth import require_buyer

from ...services.common.notification_service import notification_service

router = APIRouter(
    prefix="/buyer/notifications",
    tags=["buyer-notifications"],
)


@router.get("")
async def get_my_notifications(
        limit: int = Query(20, ge=1, le=100),
        cursor: Optional[str] = Query(None),
        unread_only: bool = Query(False),
        buyer_info: dict = Depends(require_buyer)
):
    """
    Lấy danh sách thông báo của Người mua.
    """
    user = buyer_info['user']

    return await notification_service.get_notifications(
        user_id=user.buyer_id,
        role="buyer",
        limit=limit,
        cursor=cursor,
        unread_only=unread_only
    )


@router.put("/{notif_id}/read")
async def mark_notification_read(
        notif_id: str,
        buyer_info: dict = Depends(require_buyer)
):
    """
    **Đánh dấu một thông báo cụ thể là đã đọc.**

    Dùng khi người dùng nhấn vào một thông báo cụ thể trên danh sách.

    - **notif_id**: ID của thông báo cần xử lý.
    """
    user = buyer_info['user']

    success = await notification_service.mark_as_read(notif_id, user.buyer_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Thông báo không tồn tại"
        )

    return {"message": "Đã đánh dấu đã đọc"}

@router.put("/read-all")
async def mark_all_buyer_notifications_read(
    buyer_info: dict = Depends(require_buyer)
):
    """
    **Đánh dấu tất cả thông báo của người dùng là đã đọc.**

    Chức năng "Đọc tất cả" thường dùng cho nút bấm ở góc danh sách thông báo để nhanh chóng làm sạch số lượng thông báo chưa đọc.
    """
    user = buyer_info['user']
    await notification_service.mark_all_as_read(user.buyer_id, role="buyer")
    return {"message": "Đã đánh dấu đã đọc tất cả thông báo"}