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
        # 1. Nhận tham số role từ URL (ws://.../?role=buyer)
        role: str = Query(default="buyer"),
        db: AsyncSession = Depends(get_db),
):
    """
    Cổng kết nối WebSocket chung.
    """

    cookie_name = f"access_token_{role}"
    final_token = websocket.cookies.get(cookie_name)

    if not final_token:
        for r in ["admin", "seller", "buyer"]:
            t = websocket.cookies.get(f"access_token_{r}")
            if t:
                final_token = t
                role = r
                break

    # 3. Kiểm tra Token
    if not final_token:
        print(f"[WS] No token found for role: {role}")
        # Đóng kết nối ngay nếu không có token
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id, token_role = await ChatService.get_user_from_token(final_token, db)

    if not user_id or token_role != role:
        print(f"[WS] Invalid Token or Role Mismatch (Exp: {role}, Got: {token_role})")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await socket_manager.connect_socket(websocket, user_id, role)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        print(f"[WS] Disconnected: {user_id} ({role})")
        socket_manager.disconnect_socket(websocket, user_id, role)

    except Exception as e:
        print(f"[WS] Error: {e}")
        socket_manager.disconnect_socket(websocket, user_id, role)