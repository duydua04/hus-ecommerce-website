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
    Kiểm tra và trả về người dùng hiện tại.
    """
    token = None
    host = request.headers.get("host", "").lower()

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        if "admin.fastbuy.io.vn" in host:
            token = request.cookies.get("access_token_admin")
        elif "seller.fastbuy.io.vn" in host:
            token = request.cookies.get("access_token_seller")
        elif "fastbuy.io.vn" in host:  # Bao gồm cả domain chính
            token = request.cookies.get("access_token_buyer")

        # 3. Fallback: Nếu vẫn chưa tìm thấy (ví dụ chạy localhost hoặc IP),
        # dùng logic scopes hoặc tìm lần lượt các cookie như cũ
        if not token:
            if security_scopes.scopes:
                for scope in security_scopes.scopes:
                    token = request.cookies.get(f"access_token_{scope}")
                    if token: break

            if not token:
                for role in ["admin", "seller", "buyer"]:
                    token = request.cookies.get(f"access_token_{role}")
                    if token: break

    # --- Phần Verify Token giữ nguyên như cũ ---
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    try:
        payload = verify_access_token(token)
    except (ExpiredSignatureError, InvalidTokenError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    role = payload.get('role')
    sub = payload.get('sub')

    # KIỂM TRA BẢO MẬT: Role trong Token phải nằm trong scope yêu cầu của endpoint
    if security_scopes.scopes and role not in security_scopes.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Quyền {role} không thể truy cập tài nguyên này",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    # --- Phần Query User DB giữ nguyên ---
    user = None
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return {"role": role, "sub": sub, "user": user}


def require_admin(info=Security(get_current_user, scopes=["admin"])):
    return info


def require_buyer(info=Security(get_current_user, scopes=["buyer"])):
    return info


def require_seller(info=Security(get_current_user, scopes=["seller"])):
    return info