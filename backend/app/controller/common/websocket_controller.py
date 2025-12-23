from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from ...config.db import get_db

from ...utils.socket_manager import socket_manager
from ...services.common.chat_service import ChatService

router = APIRouter(
    prefix="/websocket",
    tags=["websocket-stream"]
)


@router.websocket("/")
async def chat_socket_endpoint(
        websocket: WebSocket,
        token: str = Query(..., description="JWT Token for authentication"),
        db: AsyncSession = Depends(get_db),
):
    """
    [STREAM] Cổng kết nối WebSocket chung cho Chat và Notifications.
    """

    # Xác thực Token
    user_id, role = await ChatService.get_user_from_token(token, db)

    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Kết nối vào Manager (Lưu socket vào RAM)
    await socket_manager.connect_socket(websocket, user_id, role)

    try:
        while True:
            # Giữ kết nối (User không gửi tin nhắn qua đây, họ dùng API /chat/send)
            await websocket.receive_text()

    except WebSocketDisconnect:
        # 3. Ngắt kết nối
        socket_manager.disconnect_socket(websocket, user_id, role)

    except Exception as e:
        # Xử lý các lỗi khác (ví dụ: lỗi mạng)
        print(f"WebSocket Error: {e}")
        socket_manager.disconnect_socket(websocket, user_id, role)