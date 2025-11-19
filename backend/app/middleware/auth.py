from fastapi import Request, HTTPException, status, Security, Depends
from fastapi.security import SecurityScopes
from sqlalchemy.orm import Session
from jwt import ExpiredSignatureError, InvalidTokenError

from ..config.db import get_db
from ..utils.security import verify_access_token
from ..models.users import Admin, Buyer, Seller


def get_current_user(security_scopes: SecurityScopes,
                     request: Request,
                     db: Session = Depends(get_db)):
    """
    Kiểm tra và trả về người dùng hiện tại.
    """
    # Lay token cookies
    token = request.cookies.get("access_token")

    # 2. Nếu không có trong Cookie, thử tìm trong Header (Authorization: Bearer ...)
    # Dung cho truong hop test tren docs
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    # 3. Báo lỗi "Missing access token" neu khong tim thay o ca 2 noi
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    # Giai ma token
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

    if security_scopes.scopes and role not in security_scopes.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient scope",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    user = None
    if role == 'admin':
        user = db.query(Admin).filter(Admin.email == sub).first()
    elif role == 'buyer':
        user = db.query(Buyer).filter(Buyer.email == sub).first()
    elif role == 'seller':
        user = db.query(Seller).filter(Seller.email == sub).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

    return {"role": role, "sub": sub, "user": user}


# Các hàm dependency giữ nguyên
def require_admin(info=Security(get_current_user, scopes=["admin"])):
    return info


def require_buyer(info=Security(get_current_user, scopes=["buyer"])):
    return info


def require_seller(info=Security(get_current_user, scopes=["seller"])):
    return info