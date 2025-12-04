from typing import Dict, Any
from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy.orm import Session

from ...config import get_db
from ...models.users import Buyer, Seller, Admin
from ...models.notification import Notification
from ..common.notification_service import BaseNotificationService
from ...utils.sse_manager import sse_manager


class AdminNotificationService(BaseNotificationService):
    """
    Service chuyên trách gửi thông báo cho Admin.
    """

    async def _broadcast_to_admins(self, title: str, message: str, event_type: str, data: Dict[str, Any]):
        # 1. Lấy danh sách Admin từ Postgres (Dùng self.db từ lớp cha)
        admins = self.db.query(Admin).all()
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

        # 3. Bắn SSE Broadcast
        sse_payload = {
            "title": title,
            "message": message,
            "data": data,
            "event_type": event_type,
            "created_at": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "is_read": False
        }
        await sse_manager.broadcast_to_role(role="admin", event=event_type, data=sse_payload)


    async def notify_new_buyer_registration(self, buyer: Buyer):
        """
        Kịch bản: Có khách hàng (Buyer) mới đăng ký.
        """
        title = "Khách hàng mới"
        message = f"Khách hàng {buyer.fname} {buyer.lname}vừa tạo tài khoản."

        data = {
            "user_id": buyer.buyer_id,
            "role": "buyer",
            "email": buyer.email,
            "phone": buyer.phone or None,
            "action": "view_detail"
        }

        await self._broadcast_to_admins(title, message, "new_user_registered", data)

    async def notify_new_seller_registration(self, seller: Seller):
        """
        Kịch bản: Có đối tác (Seller) mới đăng ký.
        """
        title = "Đối tác bán hàng mới"
        message = f"Shop {seller.shop_name} vừa đăng ký gia nhập sàn."

        data = {
            "user_id": seller.seller_id,
            "role": "seller",
            "email": seller.email,
            "phone": seller.phone or None,
            "shop_name": seller.shop_name,
        }

        await self._broadcast_to_admins(title, message, "new_user_registered", data)


def get_admin_notif_service(db: Session = Depends(get_db)):
    return AdminNotificationService(db)