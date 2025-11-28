from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status, File, UploadFile
from datetime import datetime, timezone
from typing import Optional, List

from starlette.datastructures import UploadFile

from ...config import public_url
from ...models.chat import Conversation, Message
from ...models.users import Buyer, Seller
from ...schemas.chat import SendMessageRequest
from ...utils.chat_manager import chat_manager
from ...utils.security import verify_access_token
from ...utils.storage import upload_many_via_backend

# --- Helper Logic ---
def update_conversation_meta(db: Session, conversation: Conversation, content: str, has_images: bool, sender: str):
    """Update thong tin cua hoi thoai ve so tin nhan chua doc"""

    preview = content if content else ("[Hình ảnh]" if has_images else "Tin nhắn mới")

    conversation.last_message = preview
    conversation.last_message_at = datetime.now(timezone.utc)

    # Tăng unread cho người nhận
    recipient_role = "seller" if sender == "buyer" else "buyer"
    current_counts = dict(conversation.unread_counts) if conversation.unread_counts else {"buyer": 0, "seller": 0}
    current_counts[recipient_role] = current_counts.get(recipient_role, 0) + 1

    conversation.unread_counts = current_counts
    db.add(conversation)
    db.commit()



async def send_direct_message_service(db: Session, sender_id: int, sender: str, payload: SendMessageRequest):
    """Ham gui tin nhan truc tiep"""

    sender = sender.lower()
    recipient_role = "seller" if sender == "buyer" else "buyer"

    # Kiem tra nguoi nhan bang id cua nguoi do trong bang tuong ung
    recipient = None
    if recipient_role == "seller":
        recipient = (db.query(Seller)
                     .filter(Seller.seller_id == payload.recipient_id)
                     .first()
        )
    else:
        recipient = (db.query(Buyer)
                     .filter(Buyer.buyer_id == payload.recipient_id)
                     .first()
        )

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipient {recipient_role} not found")

    # Tìm Conversation
    conversation = None
    if payload.conversation_id:
        conversation = (db.query(Conversation)
                        .filter(Conversation.conversation_id == payload.conversation_id)
                        .first()
        )

    if not conversation:
        # Tìm theo cặp ID
        buyer_id = sender_id if sender == 'buyer' else payload.recipient_id
        seller_id = payload.recipient_id if sender == 'buyer' else sender_id

        conversation = db.query(Conversation).filter(
            Conversation.buyer_id == buyer_id,
            Conversation.seller_id == seller_id
        ).first()

    # Tu dong tao cuoc tro chuyen neu chua co, chi co buyer duoc gui truoc
    if not conversation:
        if sender == 'seller':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seller cannot start a new conservation."
            )

        conversation = Conversation(
            buyer_id=sender_id,
            seller_id=payload.recipient_id,
            last_message="Bắt đầu trò chuyện",
            unread_counts={"buyer": 0, "seller": 0}
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Tao tin nhan moi
    new_msg = Message(
        conversation_id=conversation.conversation_id,
        sender=sender,
        content=payload.content,
        images=payload.image_urls
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # Update Metadata
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

    db.refresh(new_msg)

    return new_msg



def get_history_cursor_service(db: Session, conversation_id: int, cursor: Optional[str], limit: int):
    """Ham de load tin nhan, su dung ki thuat Pagination de phan trang"""

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


def get_conversations_service(db: Session, user_id: int, role: str):
    query = db.query(Conversation).options(
        joinedload(Conversation.seller),
        joinedload(Conversation.buyer)
    )

    if role == 'buyer':
        query = query.filter(Conversation.buyer_id == user_id)
    else:
        query = query.filter(Conversation.seller_id == user_id)

    # Sắp xếp và thực thi truy vấn
    conversations = query.order_by(Conversation.last_message_at.desc()).all()

    # 4. Map dữ liệu trả về
    results = []

    for conv in conversations:
        partner_info = None

        # Xử lý logic xác định người nhắn tin với mình
        if role == 'buyer':
            # Nếu mình là Buyer -> Đối phương là Seller
            partner = conv.seller
            if partner:
                partner_info = {
                    "id": partner.seller_id,
                    "name": partner.shop_name,
                    "avatar": public_url(getattr(partner, "avt_url", None)),
                    "role": "seller"
                }
        else:
            # Nếu mình là Seller -> Đối phương là Buyer
            partner = conv.buyer
            if partner:
                partner_info = {
                    "id": partner.buyer_id,  # Hoặc partner.id tùy model của bạn
                    "name": f"{partner.fname} {partner.lname}",
                    "avatar": public_url(getattr(partner, "avt_url", None)),
                    "role": "buyer"
                }

        if not partner_info:
            partner_info = {
                "id": 0,
                "name": "Người dùng bị ẩn",
                "avatar": None,
                "role": "Unknown"
            }

        results.append({
            "conversation_id": conv.conversation_id,
            "last_message": conv.last_message,
            "last_message_at": conv.last_message_at,
            "unread_counts": conv.unread_counts,
            "partner": partner_info or {}
        })

    return results


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


async def upload_images(files: List[UploadFile] = File(...)):
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Max 5 files"
        )

    results = await upload_many_via_backend(folder="chat", files=files, max_size_mb=1)

    return {"urls": [public_url(r['object_key']) for r in results]}


def get_user_id(user, role: str):
    if role == 'buyer':
        return user.buyer_id
    elif role == 'seller':
        return user.seller_id
    return getattr(user, 'id', None)
