from fastapi import (
    APIRouter, Depends, Query, WebSocket, WebSocketDisconnect,
    UploadFile, File
)
from typing import List
from ...config.db import get_db
from ...middleware.auth import get_current_user
from ...schemas.chat import MessageResponse, ChatHistoryResponse, ConversationResponse
from ...services.common.chat_service import *
from ...utils.chat_manager import chat_manager
from ...utils import storage
from ...config.s3 import public_url

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)


@router.post("/upload")
async def upload_chat_images(
        files: List[UploadFile] = File(...),
        current_user: dict = Depends(get_current_user)
):

    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Max 5 files")

    results = await storage.upload_many_via_backend(folder="chat", files=files, max_size_mb=1)

    return {"urls": [public_url(r['object_key']) for r in results]}


@router.post("/send", response_model=MessageResponse)
async def send_message(
        payload: SendMessageRequest,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    user = current_user['user']
    role = current_user['role']
    user_id = get_user_id(user, role)

    return await send_direct_message_service(db, user_id, role, payload)


@router.get("/{conversation_id}/messages", response_model=ChatHistoryResponse)
def get_messages(
        conversation_id: int,
        cursor: Optional[str] = Query(None),
        limit: int = Query(20),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    return get_history_cursor_service(db, conversation_id, cursor, limit)


@router.get("/conversations", response_model=List[ConversationResponse])
def get_inbox(
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    user = current_user['user']
    role = current_user['role']
    user_id = get_user_id(user, role)

    return get_conversations_service(db, user_id, role)


@router.websocket("/ws/chat")
async def chat_socket_endpoint(
        websocket: WebSocket,
        token: str = Query(...),
        db: Session = Depends(get_db)
):

    user_id, role = get_user_from_token_param(token, db)

    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await chat_manager.connect(websocket, user_id, role)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        chat_manager.disconnect(user_id, role)