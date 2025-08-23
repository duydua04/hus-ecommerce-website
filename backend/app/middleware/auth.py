from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..utils.security import decode_token
from ..models.users import Admin, Buyer, Seller

bearer = HTTPBearer(auto_error=False)

def get_current_user(cred: HTTPAuthorizationCredentials = Depends(bearer),
                     db: Session = Depends(get_db)):
    """
    Kiem tra va tra ve nguoi dung hient ai dang truy cap
    """
    if cred is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    try:
        payload = decode_token(cred.credentials)
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return {"role": role, "sub": sub, "user": user}

# Các hàm dùng làm depends router cần giới hạn quyền, code 403 may chu tu choi xac thuc
def require_admin(info = Depends(get_current_user)):
    if info["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return info

def require_buyer(info = Depends(get_current_user)):
    if info["role"] != 'buyer':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Buyer only")
    return info

def require_seller(info = Depends(get_current_user)):
    if info["role"] != 'seller':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seller only")
    return info