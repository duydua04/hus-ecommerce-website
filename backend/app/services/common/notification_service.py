from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from beanie import PydanticObjectId
from sqlalchemy.orm import Session
from ...models import Admin, Buyer
from ...models.notification import Notification
from ...utils.sse_manager import sse_manager


# HÀM DÙNG CHUNG
async def create_and_send_notification(
        user_id: int, role: str, title: str,
        message: str, event: str,data: dict = None
):

    notif = Notification(
        recipient_id=user_id,
        recipient_role=role,
        title=title,
        message=message,
        event_type=event,
        data=data or {}
    )

    await notif.insert()

    # Bắn Realtime SSE
    payload = {
        "id": str(notif.id),
        "title": title,
        "message": message,
        "data": data,
        "created_at": str(notif.created_at),
        "is_read": False
    }

    await sse_manager.send_to_user(user_id, role, event, payload)

    return notif


async def _broadcast_to_all_admins(
        db: Session,
        title: str,
        message: str,
        event_type: str,
        data: Dict[str, Any]
):
    """
    Lưu DB cho từng Admin và bắn SSE.
    """

    admins = db.query(Admin).all()
    if not admins:
        return

    for admin in admins:
        admin_id = getattr(admin, 'admin_id', None)

        notif = Notification(
            recipient_id=admin_id,
            recipient_role="admin",
            title=title,
            message=message,
            event_type=event_type,
            data=data,
            created_at=datetime.now(timezone.utc),
            is_read=False
        )
        await notif.insert()

    sse_payload = {
        "title": title,
        "message": message,
        "data": data,
        "event_type": event_type,
        "created_at": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "is_read": False
    }

    await sse_manager.broadcast_to_role(role="admin", event=event_type, data=sse_payload)


# HAM CHO ADMIN
async def notify_new_buyer_registration(db: Session, buyer: Buyer):
    """Xử lý nội dung thông báo khi có Buyer mới"""

    title = "Khách hàng mới"
    message = f"Khách hàng {buyer.lname} {buyer.fname} vừa đăng ký tài khoản."

    data = {
        "user_id": buyer.buyer_id,
        "role": "buyer",
        "email": buyer.email,
    }

    await _broadcast_to_all_admins(
        db=db,
        title=title,
        message=message,
        event_type="new_user_registered",
        data=data
    )


async def notify_new_seller_registration(db: Session, seller):
    """Xử lý nội dung thông báo khi có Seller mới"""
    title = "Đối tác bán hàng mới"
    message = f"Shop {seller.shop_name} vừa đăng ký gia nhập sàn."

    data = {
        "user_id": seller.seller_id,
        "role": "seller",
        "email": seller.email,
        "shop_name": seller.shop_name,
    }

    await _broadcast_to_all_admins(
        db=db,
        title=title,
        message=message,
        event_type="new_user_registered",
        data=data
    )


async def get_notifications(
        user_id: int,
        role: str,
        limit: int = 20,
        unread_only: bool = False
):
    # Tạo query cơ bản
    query = Notification.find(
        Notification.recipient_id == user_id,
        Notification.recipient_role == role
    )

    # Nếu chỉ lấy tin chưa đọc
    if unread_only:
        query = query.find(Notification.is_read == False)

    # Sắp xếp mới nhất trước
    return await query.sort("-created_at").limit(limit).to_list()



async def mark_as_read(notif_id: str, user_id: int):
    """
    Đánh dấu 1 thông báo là đã đọc.
    """
    try:
        oid = PydanticObjectId(notif_id)
        notif = await Notification.get(oid)
    except:
        return False

    if not notif or notif.recipient_id != user_id:
        return False

    notif.is_read = True
    await notif.save()

    return True

