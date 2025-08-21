from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..utils.security import decode_token
from ..models.users import Admin, Buyer, Seller

bearer = HTTPBearer(auto_error=False)

def get_current_user(cred: HTTPAuthorizationCredentials = Depends(bearer),
                     db: Session = Depends(get_db())):
    #Neu khong co token thi tra ve loi 401
    if cred is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    try:
        payload = decode_token(cred.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

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