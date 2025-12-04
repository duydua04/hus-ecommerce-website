from typing import List
from fastapi import APIRouter, Depends, HTTPException

from ...middleware.auth import require_admin
from ...schemas.notification import NotificationResponse

from ...services.admin.admin_notification_service import (
    AdminNotificationService, get_admin_notif_service
)

router = APIRouter(
    prefix="/admin/notifications",
    tags=["admin-notifications"]
)


@router.get("/", response_model=List[NotificationResponse])
async def get_admin_notifications(
        limit: int = 20,
        admin_info=Depends(require_admin),  # Chặn ngay từ cửa
        service: AdminNotificationService = Depends(get_admin_notif_service)
):
    # Lấy ID admin (admin_id hoặc id)
    user = admin_info['user']
    user_id = getattr(user, 'admin_id', None)

    return await service.get_notifications(user_id, "admin", limit=limit)


@router.put("/{notif_id}/read")
async def mark_read(
        notif_id: str,
        admin_info=Depends(require_admin),
        service: AdminNotificationService = Depends(get_admin_notif_service)
):
    user = admin_info['user']
    user_id = getattr(user, 'admin_id', getattr(user, 'id', None))

    success = await service.mark_as_read(notif_id, user_id)
    if not success: raise HTTPException(404, "Not found")
    return {"status": "ok"}

