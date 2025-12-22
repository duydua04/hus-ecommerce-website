from typing import List
from fastapi import APIRouter, Depends, HTTPException

from ...middleware.auth import require_buyer
from ...schemas.notification import NotificationResponse
from ...services.buyer.buyer_notification_service import (
    BuyerNotificationService, get_buyer_notif_service
)

router = APIRouter(
    prefix="/buyer/notifications",
    tags=["buyer-notifications"]
)


@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(
        limit: int = 20,
        unread_only: bool = False,
        buyer_info=Depends(require_buyer),
        service: BuyerNotificationService = Depends(get_buyer_notif_service)
):
    """
    Lấy danh sách thông báo của Buyer đang đăng nhập.
    """
    user = buyer_info['user']
    # user là object SQLAlchemy, lấy id từ user.buyer_id

    return await service.get_notifications(
        user_id=user.buyer_id,
        role="buyer",
        limit=limit,
        unread_only=unread_only
    )


@router.put("/{notif_id}/read")
async def mark_notification_read(
        notif_id: str,
        buyer_info=Depends(require_buyer),
        service: BuyerNotificationService = Depends(get_buyer_notif_service)
):
    """
    Đánh dấu đã đọc 1 thông báo
    """
    user = buyer_info['user']

    success = await service.mark_as_read(notif_id, user.buyer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Thông báo không tồn tại hoặc không hợp lệ")

    return {"message": "Đã đánh dấu đã đọc"}