from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import Optional

from ...models.chat import Conversation, Message
from ...models.users import Buyer, Seller
from ...schemas.chat import SendMessageRequest
from ...utils.chat_manager import chat_manager
from ...utils.security import verify_access_token


# --- Helper Logic ---
def update_conversation_meta(db: Session, conversation: Conversation, content: str, has_images: bool, sender: str):
    preview = content if content else ("[Hình ảnh]" if has_images else "Tin nhắn mới")

    conversation.last_message = preview
    conversation.last_message_at = datetime.utcnow()

    # Tăng unread cho người nhận
    recipient_role = "seller" if sender == "buyer" else "buyer"
    current_counts = dict(conversation.unread_counts) if conversation.unread_counts else {"buyer": 0, "seller": 0}
    current_counts[recipient_role] = current_counts.get(recipient_role, 0) + 1

    conversation.unread_counts = current_counts
    db.add(conversation)
    db.commit()


# --- Main Logic ---

async def send_direct_message_service(db: Session, sender_id: int, sender: str, payload: SendMessageRequest):
    sender = sender.lower()
    recipient_role = "seller" if sender == "buyer" else "buyer"

    # 1. KIỂM TRA NGƯỜI NHẬN (Query theo đúng ID riêng của bảng)
    recipient = None
    if recipient_role == "seller":
        recipient = db.query(Seller).filter(Seller.seller_id == payload.recipient_id).first()
    else:
        recipient = db.query(Buyer).filter(Buyer.buyer_id == payload.recipient_id).first()

    if not recipient:
        raise HTTPException(status_code=404, detail=f"Recipient {recipient_role} not found")

    # 2. Tìm Conversation
    conversation = None
    if payload.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.conversation_id == payload.conversation_id).first()

    if not conversation:
        # Tìm theo cặp ID
        buyer_id = sender_id if sender == 'buyer' else payload.recipient_id
        seller_id = payload.recipient_id if sender == 'buyer' else sender_id

        conversation = db.query(Conversation).filter(
            Conversation.buyer_id == buyer_id,
            Conversation.seller_id == seller_id
        ).first()

    # 3. Auto Create Conversation
    if not conversation:
        buyer_id = sender_id if sender == 'buyer' else payload.recipient_id
        seller_id = payload.recipient_id if sender == 'buyer' else sender_id

        conversation = Conversation(
            buyer_id=buyer_id,
            seller_id=seller_id,
            last_message="Bắt đầu trò chuyện",
            unread_counts={"buyer": 0, "seller": 0}
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 4. Create Message
    new_msg = Message(
        conversation_id=conversation.conversation_id,
        sender=sender,
        content=payload.content,
        images=payload.image_urls
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)  # Refresh lần 1

    # 5. Update Metadata
    update_conversation_meta(db, conversation, payload.content, bool(payload.image_urls), sender)

    # 6. Send WebSocket
    ws_data = {
        "type": "chat",
        "conversation_id": conversation.conversation_id,
        "content": payload.content,
        "images": payload.image_urls,
        "sender": sender,
        "created_at": new_msg.created_at.isoformat()
    }
    await chat_manager.send_personal_message(ws_data, payload.recipient_id, recipient_role)

    # 7. QUAN TRỌNG: Refresh lần cuối để tránh lỗi Pydantic Validation Error
    db.refresh(new_msg)

    return new_msg


def get_history_cursor_service(db: Session, conversation_id: int, cursor: Optional[str], limit: int):
    query = db.query(Message).filter(Message.conversation_id == conversation_id)

    if cursor:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            query = query.filter(Message.created_at < cursor_dt)
        except ValueError:
            pass

    messages = query.order_by(Message.created_at.desc()).limit(limit + 1).all()

    next_cursor = None
    if len(messages) > limit:
        next_item = messages.pop()
        next_cursor = next_item.created_at.isoformat()

    messages.reverse()
    return {"messages": messages, "next_cursor": next_cursor}


def get_inbox_service(db: Session, user_id: int, role: str):
    query = db.query(Conversation)

    if role == 'buyer':
        query = query.filter(Conversation.buyer_id == user_id)
    else:
        query = query.filter(Conversation.seller_id == user_id)

    return query.order_by(Conversation.last_message_at.desc()).all()

def get_user_from_token_param(token: str, db: Session):
    """Giải mã token và tìm user trong DB"""
    try:
        payload = verify_access_token(token)
        email, role = payload.get("sub"), payload.get("role")

        user = None
        # Quan trọng: Query đúng bảng và lấy đúng ID
        if role == 'buyer':
            user = db.query(Buyer).filter(Buyer.email == email).first()
            if user: return user.buyer_id, role

        elif role == 'seller':
            user = db.query(Seller).filter(Seller.email == email).first()
            if user: return user.seller_id, role

    except Exception:
        return None, None
    return None, None


def get_user_id(user, role: str):
    if role == 'buyer':
        return user.buyer_id
    elif role == 'seller':
        return user.seller_id
    return getattr(user, 'id', None)
