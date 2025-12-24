from datetime import datetime, timezone
from typing import Dict, Any, Optional

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from beanie import PydanticObjectId

from ...config.db import get_db
from ...models.notification import Notification

from ...utils.socket_manager import socket_manager


class BaseNotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db


    @staticmethod
    async def send_unicast(
            user_id: int,
            role: str,
            title: str,
            message: str,
            event: str,
            data: Dict[str, Any] = None
    ):
        """
        Lưu thông báo vào MongoDB và gửi Realtime qua WebSocket (Redis Pub/Sub) cho 1 người cụ thể.
        """
        # 1. Lưu vào Database (Beanie Async)
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

        # 2. Tạo Payload gửi qua Socket
        ws_payload = {
            "type": "NOTIFICATION",
            "id": str(notif.id),
            "title": title,
            "message": message,
            "event": event,
            "data": data or {},
            "created_at": str(notif.created_at),
            "is_read": False
        }

        await socket_manager.send_to_user(ws_payload, user_id, role)

        return notif

    @staticmethod
    async def get_notifications(
            user_id: int,
            role: str,
            limit: int = 20,
            cursor: Optional[str] = None,
            unread_only: bool = False
    ):
        """
        Lấy danh sách thông báo
        """
        query = Notification.find(
            Notification.recipient_id == user_id,
            Notification.recipient_role == role
        )

        if unread_only:
            query = query.find(Notification.is_read == False)

        if cursor:
            try:
                obj_id = PydanticObjectId(cursor)
                query = query.find(Notification.id < obj_id)
            except Exception:
                pass

        results = await query.sort("-id").limit(limit).to_list()

        next_cursor = None
        has_more = False

        if results:
            last_item = results[-1]
            next_cursor = str(last_item.id)

            count_remaining = await Notification.find(
                Notification.recipient_id == user_id,
                Notification.recipient_role == role,
                Notification.id < last_item.id
            ).count()

            has_more = count_remaining > 0

        return {
            "items": results,
            "next_cursor": next_cursor,
            "has_more": has_more
        }


    @staticmethod
    async def mark_as_read(notif_id: str, user_id: int) -> bool:
        """
        Đánh dấu 1 thông báo đã đọc.
        """
        try:
            oid = PydanticObjectId(notif_id)
            notif = await Notification.get(oid)
        except Exception:
            # Lỗi format ID
            return False

        if not notif or notif.recipient_id != user_id:
            return False

        if not notif.is_read:
            notif.is_read = True
            await notif.save()

        return True


def get_notification_service(db: AsyncSession = Depends(get_db)):
    return BaseNotificationService(db)