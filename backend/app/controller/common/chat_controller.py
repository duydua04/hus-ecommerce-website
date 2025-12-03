from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from ...config.db import get_db
from ...middleware.auth import get_current_user
from ...schemas.chat import MessageResponse, ChatHistoryResponse, ConversationResponse
from ...services.common.chat_service import *
from ...utils.chat_manager import chat_manager


router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)


@router.post("/upload")
async def upload_images(files: List[UploadFile] = File(...), _=Depends(get_current_user)):
    return await upload_images(files)


@router.post("/send", response_model=MessageResponse)
async def send_message(payload: SendMessageRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return await send_direct_message_service(
        db, get_user_id(current_user['user'], current_user['role']),
        current_user['role'], payload
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_inbox(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return await get_inbox_service(
        db, get_user_id(current_user['user'], current_user['role']), current_user['role']
    )


@router.get("/{conversation_id}/messages", response_model=ChatHistoryResponse)
async def get_messages(conversation_id: str, cursor: Optional[str] = None, limit: int = 20, _=Depends(get_current_user)):
    return await get_history_cursor_service(conversation_id, cursor, limit)


@router.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    uid, role = get_user_from_token(token, db)
    if not uid:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await chat_manager.connect(websocket, uid, role)
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, uid, role)