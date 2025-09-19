from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..utils.security import decode_token, verify_access_token
from ..models.users import Admin, Buyer, Seller

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token",  # URL endpoint để lấy token
    auto_error=False
)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Kiem tra va tra ve nguoi dung hient ai dang truy cap
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        payload = verify_access_token(token)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = None
    role = payload.get('role')
    sub = payload.get('sub')

    if role == 'admin':
        user = db.query(Admin).filter(Admin.email == sub).first()
    elif role == 'buyer':
        user = db.query(Buyer).filter(Buyer.email == sub).first()
    elif role == 'seller':
        user = db.query(Seller).filter(Seller.email == sub).first()
    else:
        user = None

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"})

    return {"role": role, "sub": sub, "user": user}

# Các hàm dùng làm depends router cần giới hạn quyền, code 403 may chu tu choi xac thuc
def require_admin(info = Depends(get_current_user)):
    if info["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only"
        )

    return info

def require_buyer(info = Depends(get_current_user)):
    if info["role"] != 'buyer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyer only"
        )

    return info

def require_seller(info = Depends(get_current_user)):
    if info["role"] != 'seller':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller only"
        )

    return info