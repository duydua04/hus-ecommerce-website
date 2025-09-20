from fastapi import  HTTPException, status
from sqlalchemy.orm import Session
from ...config.settings import settings
from ...models.users import Admin, Seller, Buyer
from ...schemas.auth import RegisterBuyer, RegisterSeller, Login, OAuth2Token
from ...schemas.user import BuyerResponse, SellerResponse
from ...utils.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, verify_refresh_token
)


def email_or_phone_taken(db: Session, model, email: str, phone: str):
    return db.query(model).filter((model.email == email) | (model.phone == phone)).first() is not None


# Cac ham Register
def register_buyer(db: Session, payload: RegisterBuyer):
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
    return BuyerResponse.model_validate(buyer)


def register_seller(db: Session, payload: RegisterSeller):
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