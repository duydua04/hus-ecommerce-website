from datetime import datetime, timezone
from typing import Optional, List

from fastapi import HTTPException, UploadFile, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...config import public_url
from ...utils.socket_manager import socket_manager
from ...utils.storage import storage
from ...utils.security import verify_access_token

from ...models.chat import Conversation, Message
from ...models.users import Buyer, Seller

from ...schemas.chat import SendMessageRequest
from ...config.db import get_db


class ChatService:

    def __init__(self, db: AsyncSession):
        self.db = db


    @staticmethod
    def get_user_id(user, role):
        """Helper lấy ID chuẩn từ object User (Buyer/Seller)"""
        if role == 'buyer':
            return user.buyer_id
        elif role == 'seller':
            return user.seller_id
        return getattr(user, 'id', None)


    @staticmethod
    async def get_user_from_token(token: str, db: AsyncSession):
        """Helper lấy User từ Token (Async)"""
        try:
            p = verify_access_token(token)
            email, role = p['sub'], p['role']

            if role == 'buyer':
                stmt = select(Buyer).where(Buyer.email == email)
                result = await db.execute(stmt)
                u = result.scalar_one_or_none()
                if u:
                    return u.buyer_id, role

            elif role == 'seller':
                stmt = select(Seller).where(Seller.email == email)
                result = await db.execute(stmt)
                u = result.scalar_one_or_none()
                if u:
                    return u.seller_id, role
        except Exception:
            pass
        return None, None


    async def _attach_partner_info(self, conversations: list, role: str):
        """
        Ghép thông tin User từ Postgres vào danh sách Chat Mongo.
        """
        results = []
        target_ids = []

        # 1. Gom ID
        for conv in conversations:
            target_ids.append(conv.seller_id if role == 'buyer' else conv.buyer_id)

        if not target_ids:
            return []

        # Query Postgres
        users_map = {}
        if role == 'buyer':
            stmt = select(Seller).where(Seller.seller_id.in_(target_ids))
            result = await self.db.execute(stmt)
            sellers = result.scalars().all()
            users_map = {s.seller_id: s for s in sellers}
        else:
            stmt = select(Buyer).where(Buyer.buyer_id.in_(target_ids))
            result = await self.db.execute(stmt)
            buyers = result.scalars().all()
            users_map = {u.buyer_id: u for u in buyers}

        # Map dữ liệu
        for conv in conversations:
            pid = conv.seller_id if role == 'buyer' else conv.buyer_id
            user_obj = users_map.get(pid)

            partner_info = {
                "id": pid,
                "role": "seller" if role == 'buyer' else "buyer",
                "name": "Unknown", "avatar": None
            }

            if user_obj:
                if role == 'buyer':
                    partner_info["name"] = user_obj.shop_name
                else:
                    partner_info["name"] = f"{user_obj.fname} {user_obj.lname}"

                partner_info["avatar"] = public_url(getattr(user_obj, "avt_url", None))

            results.append({
                "conversation_id": str(conv.id),
                "last_message": conv.last_message,
                "last_message_at": conv.last_message_at,
                "unread_counts": conv.unread_counts,
                "partner": partner_info
            })

        return results


    @staticmethod
    async def _update_conversation_meta(
            conversation: Conversation,
            content: Optional[str],
            has_images: bool,
            sender_role: str
    ):
        """Cập nhật metadata hội thoại """
        preview = content if content else ("[Hình ảnh]" if has_images else "Tin nhắn mới")

        conversation.last_message = preview
        conversation.last_message_at = datetime.now(timezone.utc)

        recipient_role = "seller" if sender_role == "buyer" else "buyer"

        if not conversation.unread_counts:
            conversation.unread_counts = {"buyer": 0, "seller": 0}

        conversation.unread_counts[recipient_role] += 1
        await conversation.save()


    async def send_message(self, sender_id: int, sender_role: str, payload: SendMessageRequest):
        """Gửi tin nhắn trực tiếp"""
        sender_role = sender_role.lower()
        recipient_role = "seller" if sender_role == "buyer" else "buyer"

        recipient = None
        if recipient_role == "seller":
            stmt = select(Seller).where(Seller.seller_id == payload.recipient_id)
            result = await self.db.execute(stmt)
            recipient = result.scalar_one_or_none()
        else:
            stmt = select(Buyer).where(Buyer.buyer_id == payload.recipient_id)
            result = await self.db.execute(stmt)
            recipient = result.scalar_one_or_none()

        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient not found"
            )

        # Find Conversation
        conv = None
        if payload.conversation_id:
            try:
                conv = await Conversation.get(payload.conversation_id)
            except:
                pass

        if not conv:
            buyer_id = sender_id if sender_role == 'buyer' else payload.recipient_id
            seller_id = payload.recipient_id if sender_role == 'buyer' else sender_id

            # Beanie find_one is async
            conv = await Conversation.find_one(
                Conversation.buyer_id == buyer_id,
                Conversation.seller_id == seller_id
            )

        # Create Conversation
        if not conv:
            if sender_role == 'seller':
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Seller cannot start chat"
                )

            conv = Conversation(
                buyer_id=sender_id, seller_id=payload.recipient_id, last_message="Started chat"
            )
            await conv.insert()

        # 4. Save Message
        new_msg = Message(
            conversation_id=str(conv.id),
            sender=sender_role,
            content=payload.content,
            images=payload.image_urls
        )
        await new_msg.insert()

        await self._update_conversation_meta(
            conv, payload.content, bool(payload.image_urls), sender_role
        )

        # WebSocket
        ws_data = {
            "type": "CHAT",
            "conversation_id": str(conv.id),
            "sender": sender_role,
            "content": new_msg.content,
            "images": new_msg.images,
            "created_at": new_msg.created_at.isoformat()
        }

        await socket_manager.send_to_user(ws_data, payload.recipient_id, recipient_role)

        return new_msg

    @staticmethod
    async def get_history(conversation_id: str, cursor: Optional[str], limit: int):
        """Lấy lịch sử chat có phân trang"""
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


    async def get_inbox(self, user_id: int, role: str):
        """Lấy danh sách hội thoại"""
        if role == 'buyer':
            query = Conversation.find(Conversation.buyer_id == user_id)
        else:
            query = Conversation.find(Conversation.seller_id == user_id)

        convs = await query.sort("-last_message_at").to_list()

        # Gọi helper (Async)
        return await self._attach_partner_info(convs, role)


    @staticmethod
    async def upload_images(files: List[UploadFile]):
        """Upload ảnh chat"""
        if len(files) > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Max 5 files"
            )

        # Gọi storage utils (đã có instance storage, async supported)
        results = await storage.upload_many(folder="chat", files=files)

        return {"urls": [public_url(r['object_key']) for r in results]}


def get_chat_service(db: AsyncSession = Depends(get_db)):
    return ChatService(db)