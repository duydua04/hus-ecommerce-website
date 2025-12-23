from typing import Dict, Any
from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...config.db import get_db
from ...models.users import Buyer, Seller, Admin
from ...models.notification import Notification
from ..common.notification_service import BaseNotificationService

from ...utils.socket_manager import socket_manager


class AdminNotificationService(BaseNotificationService):
    """
    Service chuyên trách gửi thông báo cho Admin.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(db)


    async def _broadcast_to_admins(
            self,
            title: str,
            message: str,
            event_type: str,
            data: Dict[str, Any]
    ):
        """
        Gửi thông báo cho TẤT CẢ Admin.
        """

        # 1. Lấy danh sách Admin từ Postgres
        stmt = select(Admin)
        result = await self.db.execute(stmt)
        admins = result.scalars().all()

        if not admins:
            return

        # Lặp và gửi cho từng người
        for admin in admins:
            admin_id = getattr(admin, 'admin_id',None)

            if not admin_id:
                continue

            # Lưu Notification vào Mongo cho từng Admin
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

            ws_payload = {
                "type": "NOTIFICATION",
                "id": str(notif.id),
                "title": title,
                "message": message,
                "data": data,
                "event_type": event_type,
                "created_at": str(notif.created_at),
                "is_read": False
            }

            await socket_manager.send_to_user(ws_payload, admin_id, "admin")


    async def notify_new_buyer_registration(self, buyer: Buyer):
        """
        Có khách hàng (Buyer) mới đăng ký -> Báo cho Admin.
        """
        title = "Khách hàng mới"
        message = f"Khách hàng {buyer.fname} {buyer.lname} vừa tạo tài khoản."

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
        Có đối tác (Seller) mới đăng ký -> Báo cho Admin.
        """
        title = "Đối tác bán hàng mới"
        message = f"Gian hàng {seller.shop_name} vừa đăng ký gia nhập sàn."

        data = {
            "user_id": seller.seller_id,
            "role": "seller",
            "email": seller.email,
            "phone": seller.phone or None,
            "shop_name": seller.shop_name,
        }

        await self._broadcast_to_admins(title, message, "new_user_registered", data)


def get_admin_notif_service(db: AsyncSession = Depends(get_db)):
    return AdminNotificationService(db)