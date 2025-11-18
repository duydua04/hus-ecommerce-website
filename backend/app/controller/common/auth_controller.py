from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...middleware.auth import get_current_user
from ...schemas import RefreshTokenRequest
from ...schemas.auth import RegisterBuyer, RegisterSeller, Login, OAuth2Token
from ...schemas.user import BuyerResponse, SellerResponse
from ...services.common import auth_service, gg_auth_service
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
    """Router dang ky buyer"""
    return auth_service.register_buyer(db, payload)

# Router dang ky/tao seller moi
@router.post("/register/seller", response_model=SellerResponse)
def register_seller(payload: RegisterSeller, db: Session = Depends(get_db)):
    """Router dang ky seller"""
    return auth_service.register_seller(db, payload)

# Cac router dang nhap deu tra ve token de biet la ai
@router.post("/login/admin", response_model=OAuth2Token)
def login_admin(payload: Login, response: Response, db: Session = Depends(get_db)):
    token_data = auth_service.login_admin(db, payload)
    auth_service.set_auth_cookies(response, token_data.access_token, token_data.refresh_token)
    return token_data


@router.post("/login/buyer", response_model=OAuth2Token)
def login_buyer(payload: Login, response: Response, db: Session = Depends(get_db)):
    token_data = auth_service.login_buyer(db, payload)
    auth_service.set_auth_cookies(response, token_data.access_token, token_data.refresh_token)
    return token_data


@router.post("/login/seller", response_model=OAuth2Token)
def login_seller(payload: Login, response: Response, db: Session = Depends(get_db)):
    token_data = auth_service.login_seller(db, payload)
    auth_service.set_auth_cookies(response, token_data.access_token, token_data.refresh_token)
    return token_data

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
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Endpoint Refresh Token
    """

    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing in cookie",
            headers={"WWW-Authenticate": "Bearer"}
        )

    new_token_data = auth_service.refresh_access_token(db, refresh_token)

    auth_service.set_auth_cookies(
        response,
        access_token=new_token_data.access_token,
        refresh_token=new_token_data.refresh_token
    )

    return new_token_data

# Google Login — router riêng
@router.get("/google/login/buyer")
async def google_login_buyer(request: Request):
    """Dang nhap bang gg cho buyer"""
    return await gg_auth_service.google_login_start(request, role="buyer")

@router.get("/google/login/seller")
async def google_login_seller(request: Request):
    """Router dang nhap bang gg cho seller"""
    return await gg_auth_service.google_login_start(request, role="seller")

@router.get("/google/callback")
async def google_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    return await gg_auth_service.google_login_callback(request, response, db)

@router.post("/logout")
def logout(response: Response):
    """Router dang xuat tai khoan"""
    return auth_service.logout(response)