from fastapi import Request, HTTPException, status, Security, Depends
from fastapi.security import SecurityScopes
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jwt import ExpiredSignatureError, InvalidTokenError

from ..config.db import get_db
from ..utils.security import verify_access_token
from ..models.users import Admin, Buyer, Seller


async def get_current_user(
        security_scopes: SecurityScopes,
        request: Request,
        db: AsyncSession = Depends(get_db)
):
    """
    Kiểm tra và trả về người dùng hiện tại (Async version).
    """
    # 1. Lấy token từ cookies
    token = request.cookies.get("access_token")

    # 2. Nếu không có trong Cookie, thử tìm trong Header (Authorization: Bearer ...)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    # 3. Báo lỗi "Missing access token" nếu không tìm thấy
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    # 4. Giải mã token
    try:
        payload = verify_access_token(token)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    role = payload.get('role')
    sub = payload.get('sub')

    # 5. Kiểm tra Scope (Role)
    if security_scopes.scopes and role not in security_scopes.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient scope",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    # 6. Query DB để lấy user (Async)
    user = None
    stmt = None

    if role == 'admin':
        stmt = select(Admin).where(Admin.email == sub)
    elif role == 'buyer':
        stmt = select(Buyer).where(Buyer.email == sub)
    elif role == 'seller':
        stmt = select(Seller).where(Seller.email == sub)

    if stmt is not None:
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    return {"role": role, "sub": sub, "user": user}


def require_admin(info=Security(get_current_user, scopes=["admin"])):
    return info


def require_buyer(info=Security(get_current_user, scopes=["buyer"])):
    return info


def require_seller(info=Security(get_current_user, scopes=["seller"])):
    return info