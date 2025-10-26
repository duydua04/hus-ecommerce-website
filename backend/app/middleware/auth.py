from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..utils.security import decode_token, verify_access_token
from ..models.users import Admin, Buyer, Seller

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token", # URL endpoint để lấy token
    scopes={"admin": "Admin", "seller": "Seller", "buyer": "Buyer"},
    auto_error=False
)

def get_current_user(security_scopes: SecurityScopes,
                     token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)):
    """
    Kiem tra va tra ve nguoi dung hient ai dang truy cap
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
        )

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

# Các hàm dùng làm depends router cần giới hạn quyền, code 403 may chu tu choi xac thuc
def require_admin(info = Security(get_current_user, scopes=["admin"])):
    return info

def require_buyer(info = Security(get_current_user, scopes=["buyer"])):
    return info

def require_seller(info = Security(get_current_user, scopes=["seller"])):
    return info