from fastapi import  HTTPException, status, Response
from sqlalchemy.orm import Session
from ...config.settings import settings
from ...models.users import Admin, Seller, Buyer
from ...schemas.auth import RegisterBuyer, RegisterSeller, Login, OAuth2Token
from ...schemas.user import BuyerResponse, SellerResponse
from ...utils.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, verify_refresh_token
)
from ...utils.email import send_otp_email
from ...utils.security import decode_token
from ...utils.otp import create_otp
from ...services.common.notification_service import notify_new_buyer_registration, notify_new_seller_registration


def email_or_phone_taken(db: Session, model, email: str, phone: str):
    return db.query(model).filter((model.email == email) | (model.phone == phone)).first() is not None


# Cac ham Register
async def register_buyer(db: Session, payload: RegisterBuyer):
    # Kiem tra neu email va phone da ton tai thi bao loi
    if email_or_phone_taken(db, Buyer, payload.email, payload.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone already buyer"
        )

    buyer = Buyer(
        email=payload.email,
        phone=payload.phone,
        fname=payload.fname,
        lname=payload.lname,
        password=hash_password(payload.password)
    )

    db.add(buyer)
    db.commit()
    db.refresh(buyer)

    await notify_new_buyer_registration(db, buyer)

    return BuyerResponse.model_validate(buyer)


async def register_seller(db: Session, payload: RegisterSeller):
    if email_or_phone_taken(db, Seller, payload.email, payload.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone already seller"
        )

    seller = Seller(
        email=payload.email,
        phone=payload.phone,
        fname=payload.fname,
        lname=payload.lname,
        password=hash_password(payload.password),
        shop_name=payload.shop_name
    )

    db.add(seller)
    db.commit()
    db.refresh(seller)

    await notify_new_seller_registration(db, seller)

    return SellerResponse.model_validate(seller)


# set up format token login chung
def issue_token(email: str, role: str):
    access_expires = int(getattr(settings, "OAUTH2_ACCESS_TOKEN_EXPIRE_MINUTES", 180))
    refresh_expires = int(getattr(settings, "OAUTH2_REFRESH_TOKEN_EXPIRE_DAYS", 30))

    access_token = create_access_token(sub=email, role=role, expires_minutes=access_expires)
    refresh_token = create_refresh_token(sub=email, role=role, expires_days=refresh_expires)

    return OAuth2Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=access_expires * 60,  # seconds
        scope=role  # OAuth2 scope based on user role
    )


# Cac ham login
def login_admin(db: Session, payload: Login):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if admin is None or not verify_password(payload.password, admin.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return issue_token(admin.email, "admin")


def login_buyer(db: Session, payload: Login):
    buyer = db.query(Buyer).filter(Buyer.email == payload.email).first()
    if buyer is None or not verify_password(payload.password, buyer.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return issue_token(buyer.email, role="buyer")


def login_seller(db: Session, payload: Login):
    seller = db.query(Seller).filter(Seller.email == payload.email).first()
    if seller is None or not verify_password(payload.password, seller.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    return issue_token(seller.email, role="seller")


def refresh_access_token(db: Session, refresh_token: str):
    """Làm mới access token bằng refresh token"""
    try:
        payload = verify_refresh_token(refresh_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    email = payload.get("sub")
    role = payload.get("role")

    # Kiem tra user con ton tai
    user = None
    if role == 'admin':
        user = db.query(Admin).filter(Admin.email == email).first()
    elif role == 'buyer':
        user = db.query(Buyer).filter(Buyer.email == email).first()
    elif role == 'seller':
        user = db.query(Seller).filter(Seller.email == email).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Issue new tokens
    return issue_token(email, role)


def logout(response: Response):
    """
    Ham dang xuat, xoa httponly cookie chua access_token
    """

    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=False, # Khi nao deploy thi doi sang True,
        path="/"
    )

    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=False,  # Đổi thành True khi deploy
        samesite="lax",
        path="/auth/refresh"
    )

    return {"message": "Logout successfully"}


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """
    Set token vào HttpOnly Cookie.
    """

    # Set access token
    access_minutes = int(getattr(settings, "OAUTH2_ACCESS_TOKEN_EXPIRE_MINUTES", 180))
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,       # Doi thanh true nếu chạy HTTPS - deploy
        path="/",           # Gửi kèm mọi request
        max_age=access_minutes * 60
    )

    # 2. Set Refresh Token
    refresh_days = int(getattr(settings, "OAUTH2_REFRESH_TOKEN_EXPIRE_DAYS", 30))
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,        # True nếu chạy HTTPS
        path="/auth/refresh", # Chỉ gửi cookie này khi gọi API refresh
        max_age=refresh_days * 24 * 60 * 60
    )


async def forgot_password_request(db: Session, email: str, role: str):
    """
    Xu ly yeu cau quen mat khau
    """
    user = None
    if role == 'admin':
        user = db.query(Admin).filter(Admin.email == email).first()
    elif role == 'buyer':
        user = db.query(Buyer).filter(Buyer.email == email).first()
    elif role == 'seller':
        user = db.query(Seller).filter(Seller.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this role"
        )

    otp_code = create_otp()
    otp_hash = hash_password(otp_code)

    # Gui email, lay ten de gui
    firstname = getattr(user, "fname", email)
    await send_otp_email(email, firstname, otp_code)

    # 4. Token reset chua hast otp
    reset_token = create_access_token(
        sub=email,
        role=role,
        expires_minutes=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES,
        extra={
            "type": "reset_waiting",
            "otp_hash": otp_hash
        }
    )

    return {"message": "OTP sent to email", "reset_token": reset_token}


def verify_otp_for_reset(otp_input: str, reset_token: str):
    """
    Xac thuc otp thong qua token
    """
    try:
        payload = decode_token(reset_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expired or invalid"
        )

    if payload.get("type") != "reset_waiting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token type for OTP verification"
        )

    # Lấy hash từ token
    otp_hash_in_token = payload.get("otp_hash")

    # Verify OTP
    if not verify_password(otp_input, otp_hash_in_token):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid OTP"
        )

    # Neu dung tao token moi de doi mat khau
    email = payload.get("sub")
    role = payload.get("role")

    permission_token = create_access_token(
        sub=email,
        role=role,
        expires_minutes=5,
        extra={"type": "reset_allowed"}
    )

    return {"message": "OTP verified", "permission_token": permission_token}


def reset_password_final(db: Session, new_password: str, permission_token: str):
    """
    Check token 'reset_allowed'
    Update password vao db
    """
    try:
        payload = decode_token(permission_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session expired, please start over")

    if payload.get("type") != "reset_allowed":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to reset password"
        )

    email = payload.get("sub")
    role = payload.get("role")

    # Tìm và update user
    user = None
    if role == 'admin':
        user = db.query(Admin).filter(Admin.email == email).first()
    elif role == 'buyer':
        user = db.query(Buyer).filter(Buyer.email == email).first()
    elif role == 'seller':
        user = db.query(Seller).filter(Seller.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update Pass
    user.password = hash_password(new_password)
    db.commit()

    return {"message": "Password reset successfully"}