from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...services.common import notification_service

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)


@router.get("/stream")
async def stream_notifications(
        request: Request,
        token: str = Query(..., description="Access Token truyền qua URL"),  # Token bắt buộc
        db: Session = Depends(get_db)
):
    """
    API lắng nghe sự kiện (Đơn hàng, Dashboard, System...)
    """

    # Gọi Service để xử lý xác thực và lấy luồng dữ liệu
    event_generator = await notification_service.connect_notification_stream(db, token)

    # Nếu Service trả về None (Lỗi Auth hoặc User không tồn tại) -> Báo lỗi HTTP
    if not event_generator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed or User not found"
        )

    # Nếu OK -> Trả về luồng sự kiện (Connection vẫn giữ mở)
    return EventSourceResponse(event_generator)