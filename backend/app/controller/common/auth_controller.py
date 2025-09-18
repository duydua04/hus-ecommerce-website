from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.config.db import get_db
from backend.app.middleware.auth import get_current_user
from backend.app.schemas.auth import RegisterBuyer, RegisterSeller, Login, Token
from backend.app.schemas.user import BuyerResponse, SellerResponse
from backend.app.services.common import auth_service

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# Router tra ve thong tin nguoi dung hien tai
@router.get("/me")
def get_me(info = Depends(get_current_user)):
    u = info["user"]
    return {
        "role": info["role"],
        "email": u.email,
        "fname": u.fname,
        "lname": getattr(u, "lname", None),
        "avt_url": getattr(u, "avt_url", None),
    }
# Router dang ky/tao buyer moi
@router.post("/register/buyer", response_model=BuyerResponse)
def register_buyer(payload: RegisterBuyer, db: Session = Depends(get_db)):
    return auth_service.register_buyer(db, payload)

# Router dang ky/tao seller moi
@router.post("/register/seller", response_model=SellerResponse)
def register_seller(payload: RegisterSeller, db: Session = Depends(get_db)):
    return auth_service.register_seller(db, payload)

# Cac router dang nhap deu tra ve token de biet la ai
#Router dang nhap cho admin
@router.post("/login/admin", response_model=Token)
def login_admin(payload: Login, db: Session = Depends(get_db)):
    return auth_service.login_admin(db, payload)

#Router dang nhap cho buyer
@router.post("/login/buyer", response_model=Token)
def login_buyer(payload: Login, db: Session = Depends(get_db)):
    return auth_service.login_buyer(db, payload)

#Router dang nhap cho seller
@router.post("/login/seller", response_model=Token)
def login_seller(payload: Login, db: Session = Depends(get_db)):
    return auth_service.login_seller(db, payload)