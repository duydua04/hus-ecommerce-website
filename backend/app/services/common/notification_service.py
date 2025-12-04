from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy.orm import Session
from beanie import PydanticObjectId
from ...config.db import get_db
from ...models.notification import Notification
from ...utils.sse_manager import sse_manager


class BaseNotificationService:
    def __init__(self, db: Session):
        self.db = db

    async def send_unicast(self, user_id: int, role: str, title: str, message: str, event: str, data: dict = None):
        """
        Lưu vào MongoDB và bắn SSE cho 1 người dùng cụ thể.
        """
        notif = Notification(
            recipient_id=user_id,
            recipient_role=role,
            title=title,
            message=message,
            event_type=event,
            data=data or {},
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )
        await notif.insert()

        payload = {
            "id": str(notif.id),
            "title": title,
            "message": message,
            "data": data or {},
            "created_at": str(notif.created_at),
            "is_read": False
        }

        await sse_manager.send_to_user(user_id, role, event, payload)

        return notif



    async def get_notifications(self, user_id: int, role: str, limit: int = 20, unread_only: bool = False):
        """Lấy danh sách thông báo"""

        query = Notification.find(
            Notification.recipient_id == user_id,
            Notification.recipient_role == role
        )
        if unread_only:
            query = query.find(Notification.is_read == False)

        return await query.sort("-created_at").limit(limit).to_list()


    async def mark_as_read(self, notif_id: str, user_id: int) -> bool:
        """Đánh dấu 1 thông báo đã đọc"""
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

def get_notification_service(db: Session = Depends(get_db)):
    return BaseNotificationService(db)
