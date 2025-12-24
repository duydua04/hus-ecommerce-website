from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from ...middleware.auth import require_admin
from ...schemas.notification import NotificationResponse

from ...services.admin.admin_notification_service import (
    AdminNotificationService, get_admin_notif_service
)

router = APIRouter(
    prefix="/admin/notifications",
    tags=["admin-notifications"]
)


@router.get("/")
async def get_my_notifications(
        limit: int = Query(default=20),
        cursor: Optional[str] = Query(...),
        unread_only: bool = Query(False),
        buyer_info: dict = Depends(require_admin),
        service: AdminNotificationService = Depends(get_admin_notif_service)
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
async def mark_read(
        notif_id: str,
        admin_info=Depends(require_admin),
        service: AdminNotificationService = Depends(get_admin_notif_service)
):
    user = admin_info['user']
    user_id = getattr(user, 'admin_id', None)

    success = await service.mark_as_read(notif_id, user_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Not found"
        )
    return {"status": "ok"}

