from fastapi import Depends, HTTPException, status
from ..middleware.auth import get_current_user


async def get_chat_actor(current_user: dict = Depends(get_current_user)):
    """
    Dependency user_id và role cho tính năng Chat.
    """
    user = current_user.get('user')
    role = current_user.get('role')

    if not user or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không tìm thấy thông tin định danh người dùng"
        )

    user_id = None
    if role == 'buyer':
        user_id = getattr(user, 'buyer_id', None)
    elif role == 'seller':
        user_id = getattr(user, 'seller_id', None)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể xác định ID cho vai trò {role}"
        )

    return {"user_id": user_id, "role": role}