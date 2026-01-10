from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from ...middleware.auth import require_admin
from ...services.common.notification_service import notification_service

router = APIRouter(
    prefix="/admin/notifications",
    tags=["Admin Notifications"]
)


@router.get("/")
async def get_my_notifications(
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    admin_info: dict = Depends(require_admin)
):
    """Xem lịch sử thông báo của Admin"""
    return await notification_service.get_notifications(
        user_id=admin_info['user'].admin_id,
        role="admin",
        limit=limit,
        cursor=cursor,
        unread_only=unread_only
    )


@router.put("/{notif_id}/read")
async def mark_read(
    notif_id: str,
    admin_info: dict = Depends(require_admin)
):
    """
    **Cập nhật trạng thái thông báo thành "Đã đọc".**

    Sử dụng khi Admin nhấn vào xem chi tiết hoặc nhấn nút "Đánh dấu đã đọc" trên giao diện.

    ### Tham số đường dẫn:
    - **notif_id**: ID của thông báo cần cập nhật.
    """
    success = await notification_service.mark_as_read(
        notif_id,
        admin_info['user'].admin_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}