from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from ...middleware.auth import require_buyer

from ...services.buyer.buyer_notification_service import (
    BuyerNotificationService, get_buyer_notif_service
)

router = APIRouter(
    prefix="/buyer/notifications",
    tags=["buyer-notifications"]
)


@router.get("/")
async def get_my_notifications(
        limit: int = Query(default=20),
        cursor: Optional[str] = Query(...),
        unread_only: bool = Query(False),
        buyer_info: dict = Depends(require_buyer),
        service: BuyerNotificationService = Depends(get_buyer_notif_service)
):
    """
    API lấy thông báo
    """
    user = buyer_info['user']

    return await service.get_notifications(
        user_id=user.buyer_id,
        role="buyer",
        limit=limit,
        cursor=cursor,
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