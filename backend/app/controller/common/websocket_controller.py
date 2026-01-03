from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status, Cookie
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
        access_token: str | None = Cookie(default=None),
        token: str | None = Query(default=None),

        db: AsyncSession = Depends(get_db),
):
    """
    [STREAM] Cổng kết nối WebSocket chung.
    Hỗ trợ cả Cookie (Secure) và Query Param.
    """

    final_token = access_token if access_token else token

    if not final_token:
        print("❌ [WS] No token found in Cookie or Query")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Authenticate
    user_id, role = await ChatService.get_user_from_token(final_token, db)

    if not user_id:
        print(f"❌ [WS] Invalid Token: {final_token[:10]}...")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Connect to Manager
    await socket_manager.connect_socket(websocket, user_id, role)

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()

    except WebSocketDisconnect:
        socket_manager.disconnect_socket(websocket, user_id, role)

    except Exception as e:
        print(f"WebSocket Error: {e}")
        socket_manager.disconnect_socket(websocket, user_id, role)