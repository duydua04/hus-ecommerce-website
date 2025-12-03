from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status, File, UploadFile

from ...config import public_url
from ...models.chat import Conversation, Message
from ...models.users import Buyer, Seller
from ...schemas.chat import SendMessageRequest
from ...utils.chat_manager import chat_manager
from ...utils.storage import upload_many_via_backend
from ...utils.security import verify_access_token

def attach_partner_info(conversations: list, role: str, db: Session):
    """
    Hàm này lấy danh sách ID từ Mongo -> Query 1 lần vào Postgres -> Map dữ liệu.
    """
    results = []
    target_ids = []
    for conv in conversations:
        target_ids.append(conv.seller_id if role == 'buyer' else conv.buyer_id)

    users_map = {}
    if role == 'buyer':
        sellers = db.query(Seller).filter(Seller.seller_id.in_(target_ids)).all()
        users_map = {s.seller_id: s for s in sellers}
    else:
        buyers = db.query(Buyer).filter(Buyer.buyer_id.in_(target_ids)).all()
        users_map = {b.buyer_id: b for b in buyers}

    for conv in conversations:
        pid = conv.seller_id if role == 'buyer' else conv.buyer_id
        user_obj = users_map.get(pid)

        partner_info = {
            "id": pid,
            "role": "seller" if role == 'buyer' else "buyer",
            "name": "Unknown", "avatar": None
        }

        if user_obj:
            partner_info["name"] = user_obj.shop_name if role == 'buyer' else f"{user_obj.lname} {user_obj.fname}"
            partner_info["avatar"] = public_url(getattr(user_obj, "avt_url", None))

        results.append({
            "conversation_id": str(conv.id),
            "last_message": conv.last_message,
            "last_message_at": conv.last_message_at,
            "unread_counts": conv.unread_counts,
            "partner": partner_info
        })

    return results


async def update_conversation_meta(
        conversation: Conversation,
        content: Optional[str],
        has_images: bool,
        sender_role: str
):
    """
    Cập nhật tin nhắn cuối, thời gian và tăng số tin chưa đọc.
    """

    # Xác định nội dung preview (tin nhan xem truoc hien thi ra)
    preview = content if content else ("[Hình ảnh]" if has_images else "Tin nhắn mới")
    conversation.last_message = preview
    conversation.last_message_at = datetime.now(timezone.utc)

    # 3. Tăng tin nhan chua doc cho nguoi nhan
    recipient_role = "seller" if sender_role == "buyer" else "buyer"

    # Đảm bảo dict tồn tại
    if not conversation.unread_counts:
        conversation.unread_counts = {"buyer": 0, "seller": 0}

    conversation.unread_counts[recipient_role] += 1

    await conversation.save()


async def send_direct_message_service(db: Session, sender_id: int, sender_role: str, payload: SendMessageRequest):
    """Ham quan ly viec gui tin nhan truc tiep"""

    sender_role = sender_role.lower()
    recipient_role = "seller" if sender_role == "buyer" else "buyer"

    recipient = None
    if recipient_role == "seller":
        recipient = db.query(Seller).filter(Seller.seller_id == payload.recipient_id).first()
    else:
        recipient = db.query(Buyer).filter(Buyer.buyer_id == payload.recipient_id).first()

    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Tim kiem Conversation (Mongo)
    conv = None
    if payload.conversation_id:
        try:
            conv = await Conversation.get(payload.conversation_id)
        except:
            pass

    if not conv:
        buyer_id = sender_id if sender_role == 'buyer' else payload.recipient_id
        seller_id = payload.recipient_id if sender_role == 'buyer' else sender_id

        conv = await Conversation.find_one(
            Conversation.buyer_id == buyer_id,
            Conversation.seller_id == seller_id
        )

    # Tao conversation
    if not conv:
        if sender_role == 'seller':
            raise HTTPException(
                status_code=400,
                detail="Seller cannot start chat"
            )

        conv = Conversation(
            buyer_id=sender_id, seller_id=payload.recipient_id, last_message="Started chat"
        )
        await conv.insert()

    # Luu tin nhan vao database mongodb
    new_msg = Message(
        conversation_id=str(conv.id),
        sender=sender_role,
        content=payload.content,
        images=payload.image_urls
    )
    await new_msg.insert()

    await update_conversation_meta(
        conversation=conv,
        content=payload.content,
        has_images=bool(payload.image_urls),
        sender_role=sender_role
    )

    # 6. WebSocket
    ws_data = {
        "conversation_id": str(conv.id),
        "sender": sender_role,
        "content": new_msg.content,
        "images": new_msg.images,
        "created_at": new_msg.created_at.isoformat()
    }
    await chat_manager.send_personal_message(ws_data, payload.recipient_id, recipient_role)

    return new_msg


async def get_history_cursor_service(conversation_id: str, cursor: Optional[str], limit: int):
    query = Message.find(Message.conversation_id == conversation_id)
    if cursor:
        try:
            dt = datetime.fromisoformat(cursor)
            query = query.find(Message.created_at < dt)
        except:
            pass

    msgs = await query.sort("-created_at").limit(limit + 1).to_list()
    next_cursor = None
    if len(msgs) > limit:
        last = msgs.pop()
        next_cursor = last.created_at.isoformat()

    msgs.reverse()
    return {"messages": msgs, "next_cursor": next_cursor}


async def get_inbox_service(db: Session, user_id: int, role: str):
    if role == 'buyer':
        query = Conversation.find(Conversation.buyer_id == user_id)
    else:
        query = Conversation.find(Conversation.seller_id == user_id)

    convs = await query.sort("-last_message_at").to_list()
    return attach_partner_info(convs, role, db)


async def upload_images(files: List[UploadFile] = File(...)):
    if len(files) > 5:
        raise HTTPException(400, "Max 5 files")

    results = await upload_many_via_backend(folder="chat", files=files)
    return {"urls": [public_url(r['object_key']) for r in results]}


def get_user_id(user, role):
    if role == 'buyer':
        return user.buyer_id
    elif role == 'seller':
        return user.seller_id
    return getattr(user, 'id', None)

def get_user_from_token(token, db):
    try:
        p = verify_access_token(token)
        email, role = p['sub'], p['role']
        if role == 'buyer':
            u = db.query(Buyer).filter(Buyer.email == email).first()
            if u: return u.buyer_id, role
        elif role == 'seller':
            u = db.query(Seller).filter(Seller.email == email).first()
            if u: return u.seller_id, role
    except: pass
    return None, None