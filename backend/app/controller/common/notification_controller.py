from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from ...config.db import get_db
from ...middleware.auth import get_current_user
from ...services.common import notification_service
from ...models.users import Buyer, Seller, Admin
from ...utils.security import verify_access_token
from ...utils.sse_manager import sse_manager
from ...schemas.notification import NotificationResponse    

router = APIRouter(prefix="/notifications", tags=["notifications"])


# --- HELPER: Lấy User ID từ Token (Cho SSE) ---
def get_user_sse(token, db):
    try:
        p = verify_access_token(token)
        email, role = p['sub'], p['role']

        user = None
        if role == 'buyer':
            user = db.query(Buyer).filter(Buyer.email == email).first()
            if user: return user.buyer_id, role
        elif role == 'seller':
            user = db.query(Seller).filter(Seller.email == email).first()
            if user: return user.seller_id, role
        elif role == 'admin':
            user = db.query(Admin).filter(Admin.email == email).first()
            # Admin thường dùng admin_id hoặc id
            if user: return getattr(user, 'admin_id', getattr(user, 'id', None)), role

    except Exception:
        pass
    return None, None


# --- HELPER: Lấy User ID từ Current User (Cho HTTP API) ---
def get_current_user_id(user, role):
    if role == 'buyer':
        return user.buyer_id
    elif role == 'seller':
        return user.seller_id
    elif role == 'admin':
        return getattr(user, 'admin_id', getattr(user, 'id', None))
    return getattr(user, 'id', None)


# ==========================================
# 1. SSE STREAM (Realtime)
# ==========================================
@router.get("/stream")
async def stream(
        request: Request,
        token: str = Query(...),
        db: Session = Depends(get_db)
):
    uid, role = get_user_sse(token, db)

    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token or user not found"
        )

    # Kết nối vào SSE Manager
    return EventSourceResponse(sse_manager.connect(uid, role))


# ==========================================
# 2. LẤY DANH SÁCH THÔNG BÁO (History)
# ==========================================
@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
        limit: int = Query(20, ge=1, le=100),
        unread_only: bool = False,
        current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách thông báo từ MongoDB.
    """
    user = current_user['user']
    role = current_user['role']
    user_id = get_current_user_id(user, role)

    return await notification_service.get_notifications(
        user_id=user_id,
        role=role,
        limit=limit,
        unread_only=unread_only
    )


# ==========================================
# 3. ĐÁNH DẤU ĐÃ ĐỌC (1 Cái)
# ==========================================
@router.put("/{notif_id}/read")
async def mark_as_read(
        notif_id: str,
        current_user: dict = Depends(get_current_user)
):
    user = current_user['user']
    role = current_user['role']
    user_id = get_current_user_id(user, role)

    success = await notification_service.mark_as_read(notif_id, user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or not owned by you"
        )

    return {"status": "marked as read"}

