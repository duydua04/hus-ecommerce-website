from typing import Optional, Dict, Any
from beanie import PydanticObjectId
from ...models.notification import Notification


class NotificationService:
    """
    Service chung cho toàn bộ hệ thống (Admin, Buyer, Seller).
    """

    @staticmethod
    async def get_notifications(
            user_id: int,
            role: str,
            limit: int = 20,
            cursor: Optional[str] = None,
            unread_only: bool = False
    ) -> Dict[str, Any]:

        query = Notification.find(
            Notification.recipient_id == user_id,
            Notification.recipient_role == role
        )

        if unread_only:
            query = query.find(Notification.is_read == False)

        if cursor:
            try:
                oid = PydanticObjectId(cursor)
                query = query.find(Notification.id < oid)
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
        Đánh dấu 1 thông báo là đã đọc.
        Chỉ thành công nếu thông báo đó thuộc về user_id gửi request.
        """
        try:
            oid = PydanticObjectId(notif_id)
            notif = await Notification.get(oid)
        except Exception:
            return False

        if not notif:
            return False

        # Security check: Đảm bảo không đọc trộm thông báo người khác
        if notif.recipient_id != user_id:
            return False

        if not notif.is_read:
            notif.is_read = True
            await notif.save()

        return True

    @staticmethod
    async def mark_all_as_read(user_id: int, role: str) -> int:
        """
        Đánh dấu tất cả là đã đọc (Optional feature)
        """
        result = await Notification.find(
            Notification.recipient_id == user_id,
            Notification.recipient_role == role,
            Notification.is_read == False
        ).update({"$set": {"is_read": True}})

        return result.modified_count


# Instance dùng chung (Singleton)
notification_service = NotificationService()