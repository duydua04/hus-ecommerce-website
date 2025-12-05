from typing import List, Optional
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, UploadFile, File, status
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...middleware.auth import get_current_user
from ...schemas.chat import MessageResponse, ChatHistoryResponse, ConversationResponse, SendMessageRequest
from ...utils.chat_manager import chat_manager

from ...services.common.chat_service import (
    ChatService,
    get_chat_service,
)

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)


@router.post("/upload")
async def upload_chat_images(
        files: List[UploadFile] = File(...),
        _=Depends(get_current_user),
        service: ChatService = Depends(get_chat_service)
):
    """
    Upload ảnh cho chat.
    """
    return await service.upload_images(files)


@router.post("/send", response_model=MessageResponse)
async def send_message(
        payload: SendMessageRequest,
        current_user: dict = Depends(get_current_user),
        service: ChatService = Depends(get_chat_service)
):
    """
    Gửi tin nhắn (Text hoặc Ảnh).
    """
    user = current_user['user']
    role = current_user['role']

    user_id = service.get_user_id(user, role)

    return await service.send_message(
        sender_id=user_id,
        sender_role=role,
        payload=payload
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_inbox(
        current_user: dict = Depends(get_current_user),
        service: ChatService = Depends(get_chat_service)
):
    """
    Lấy danh sách các cuộc trò chuyện.
    """
    user = current_user['user']
    role = current_user['role']
    user_id = service.get_user_id(user, role)

    return await service.get_inbox(user_id=user_id, role=role)


@router.get("/{conversation_id}/messages", response_model=ChatHistoryResponse)
async def get_messages(
        conversation_id: str,
        cursor: Optional[str] = Query(None),
        limit: int = Query(20),
        _=Depends(get_current_user),
        service: ChatService = Depends(get_chat_service)
):
    """
    Lấy lịch sử tin nhắn theo phân trang (Cursor).
    """
    return await service.get_history(
        conversation_id=conversation_id,
        cursor=cursor,
        limit=limit
    )


@router.websocket("/ws/chat")
async def chat_socket_endpoint(
        websocket: WebSocket,
        token: str = Query(...),
        db: Session = Depends(get_db),

):
    """
    Kết nối WebSocket để nhận tin nhắn Realtime.
    Auth qua Token trên URL.
    """

    user_id, role = ChatService.get_user_from_token(token, db)

    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Kết nối vào Manager
    await chat_manager.connect(websocket, user_id, role)

    try:
        while True:
            # Giữ kết nối
            await websocket.receive_text()
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, user_id, role)