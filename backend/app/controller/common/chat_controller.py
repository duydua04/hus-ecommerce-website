from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File

from ...dependencies.chat_deps import get_chat_actor
from ...services.common.chat_service import ChatService, get_chat_service
from ...schemas.chat import (
    MessageResponse,
    ChatHistoryResponse,
    ConversationResponse,
    SendMessageRequest
)

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

@router.post("/upload")
async def upload_chat_images(
    files: List[UploadFile] = File(...),
    _= Depends(get_chat_actor),
    service: ChatService = Depends(get_chat_service)
):
    """
    Upload 5 ảnh.
    """
    return await service.upload_images(files)


@router.post("/send", response_model=MessageResponse)
async def send_message(
    payload: SendMessageRequest,
    actor: dict = Depends(get_chat_actor),
    service: ChatService = Depends(get_chat_service)
):
    """
    Gửi tin nhắn
    """
    return await service.send_message(
        sender_id=actor['user_id'],
        sender_role=actor['role'],
        payload=payload
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_inbox(
    actor: dict = Depends(get_chat_actor),
    service: ChatService = Depends(get_chat_service)
):
    """
    Lấy danh sách các cuộc trò chuyện gần nhất của người dùng hiện tại.
    """
    return await service.get_inbox(
        user_id=actor['user_id'],
        role=actor['role']
    )


@router.get("/{conversation_id}/messages", response_model=ChatHistoryResponse)
async def get_messages(
    conversation_id: str,
    cursor: Optional[str] = Query(None, description="Thời điểm tin nhắn cuối cùng để lấy các tin cũ hơn"),
    limit: int = Query(20, ge=1, le=50),
    actor: dict = Depends(get_chat_actor),
    service: ChatService = Depends(get_chat_service)
):
    """
    Lấy lịch sử tin nhắn của một hội thoại theo phân trang Cursor.
    """
    return await service.get_history(
        conversation_id=conversation_id,
        cursor=cursor,
        limit=limit,
        user_id=actor['user_id'],
        role=actor['role']
    )


@router.patch("/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: str,
    actor: dict = Depends(get_chat_actor),
    service: ChatService = Depends(get_chat_service)
):
    """
    Đánh dấu toàn bộ tin nhắn trong hội thoại là đã đọc đối với vai trò hiện tại.
    """
    return await service.mark_as_read(
        conversation_id=conversation_id,
        user_id=actor['user_id'],
        role=actor['role']
    )