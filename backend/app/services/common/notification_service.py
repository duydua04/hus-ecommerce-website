from typing import List, Optional
from beanie import PydanticObjectId
# Import đúng tên model bạn đang dùng
from ...models.notification import Notification
from ...utils.sse_manager import sse_manager


# --- 1. TẠO & GỬI THÔNG BÁO ---
async def create_and_send_notification(
        user_id: int,
        role: str,
        title: str,
        message: str,
        event: str,
        data: dict = None
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

    # B. Bắn Realtime SSE
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


# --- 2. LẤY DANH SÁCH (Có lọc chưa đọc) ---
async def get_notifications(
        user_id: int,
        role: str,
        limit: int = 20,
        unread_only: bool = False  # <--- Bổ sung tham số này
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


# --- 3. ĐÁNH DẤU ĐÃ ĐỌC (1 cái) ---
async def mark_as_read(notif_id: str, user_id: int):
    """
    Đánh dấu 1 thông báo là đã đọc.
    Cần check xem thông báo đó có đúng là của user_id này không.
    """
    try:
        # Convert string ID sang PydanticObjectId
        oid = PydanticObjectId(notif_id)
        notif = await Notification.get(oid)
    except:
        return False  # ID không hợp lệ

    # Kiểm tra tồn tại và quyền sở hữu
    if not notif or notif.recipient_id != user_id:
        return False

    # Update
    notif.is_read = True
    await notif.save()

    return True

