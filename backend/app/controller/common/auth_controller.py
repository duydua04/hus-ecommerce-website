from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...middleware.auth import get_current_user
from ...schemas import RefreshTokenRequest
from ...schemas.auth import RegisterBuyer, RegisterSeller, Login, OAuth2Token
from ...schemas.user import BuyerResponse, SellerResponse
from ...services.common import auth_service
from ...models.users import Admin, Seller, Buyer
from ...utils.security import verify_password

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
@router.post("/login/admin", response_model=OAuth2Token)
def login_admin(payload: Login, db: Session = Depends(get_db)):
    return auth_service.login_admin(db, payload)

#Router dang nhap cho buyer
@router.post("/login/buyer", response_model=OAuth2Token)
def login_buyer(payload: Login, db: Session = Depends(get_db)):
    return auth_service.login_buyer(db, payload)

#Router dang nhap cho seller
@router.post("/login/seller", response_model=OAuth2Token)
def login_seller(payload: Login, db: Session = Depends(get_db)):
    return auth_service.login_seller(db, payload)

# ===== Router de test tren swagger =====
@router.post("/token", response_model=OAuth2Token)
def oauth2_password(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Dành cho Swagger "Authorize":
    - form.username: email
    - form.password: mật khẩu
    - form.scopes  : ["admin"] / ["seller"] / ["buyer"] (mặc định: buyer nếu trống)
    """
    email = form.username
    password = form.password
    role = "buyer"
    if "admin" in form.scopes:
        role = "admin"
    elif "seller" in form.scopes:
        role = "seller"

    # Xác thực người dùng theo role đã chọn
    user = None
    if role == "admin":
        user = db.query(Admin).filter(Admin.email == email).first()
    elif role == "seller":
        user = db.query(Seller).filter(Seller.email == email).first()
    else:
        user = db.query(Buyer).filter(Buyer.email == email).first()

    if user is None or not verify_password(password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password",
                            headers={"WWW-Authenticate": "Bearer"})
    return auth_service.issue_token(email=email, role=role)

# ===== Refresh =====
@router.post("/refresh", response_model=OAuth2Token)
def refresh(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(db, payload.refresh_token)