import uuid
from fastapi import HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuthError
from starlette.responses import RedirectResponse

from ...utils.google_auth import google
from ...config.settings import settings
from ...models.users import Buyer, Seller
from ...utils.security import hash_password
from .auth_service import issue_token
from ..common import notification_service


ALLOWED_ROLES = {"buyer", "seller"}
FRONTEND_BUYER_HOMEPAGE = "/"
FRONTEND_SELLER_HOMEPAGE = "/seller/products"


async def _fetch_google_user_info(request: Request) -> dict:
    """
    Trao đổi Code lấy Token từ Google và lấy thông tin User (Userinfo).
    """
    try:
        token = await google.authorize_access_token(request)
    except OAuthError as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="Missing userinfo from Google")

    if not userinfo.get("email"):
        raise HTTPException(status_code=400, detail="Google account has no email")

    return userinfo


def _get_desired_role(request: Request):
    """
    Lấy vai trò mong muốn mà user đã chọn trước khi bấm 'Login with Google'.
    Lưu trong Session ở bước login_start.
    """
    return request.session.get("oauth_target_role", "buyer")


# XU LY TIM HOAC TAO USER
async def _get_or_create_buyer(db: Session, user_info: dict):
    email = user_info.get("email")

    if db.query(Seller).filter(Seller.email == email).first():
        raise HTTPException(status_code=400, detail="Email này là Seller, không thể đăng nhập Buyer.")

    buyer = db.query(Buyer).filter(Buyer.email == email).first()

    if not buyer:
        new_buyer = Buyer(
            email=email,
            phone=None,
            fname=user_info.get("given_name", ""),
            lname=user_info.get("family_name", ""),
            password=hash_password(str(uuid.uuid4())),
            avt_url=user_info.get("picture"),
            is_active=True
        )
        db.add(new_buyer)
        db.commit()
        db.refresh(new_buyer)

        # Báo Admin
        await notification_service.notify_new_buyer_registration(db, new_buyer)
        return new_buyer

    return buyer


async def _get_or_create_seller(db: Session, user_info: dict):
    email = user_info.get("email")

    # Check trùng Buyer
    if db.query(Buyer).filter(Buyer.email == email).first():
        raise HTTPException(status_code=400, detail="Email này là Buyer, không thể đăng nhập Seller.")

    seller = db.query(Seller).filter(Seller.email == email).first()

    if not seller:
        fname = user_info.get("given_name", "")
        new_seller = Seller(
            email=email,
            phone=None,
            fname=fname,
            lname=user_info.get("family_name", ""),
            password=hash_password(str(uuid.uuid4())),
            shop_name=f"{fname} Store",
            avt_url=user_info.get("picture"),
            is_active=True
        )
        db.add(new_seller)
        db.commit()
        db.refresh(new_seller)

        await notification_service.notify_new_seller_registration(db, new_seller)
        return new_seller

    return seller


# 3. PUBLIC SERVICES: Main Flow
async def google_login_start(request: Request, role: str):
    desired_role = (role or "buyer").lower()
    if desired_role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    request.session["oauth_target_role"] = desired_role

    if not settings.GOOGLE_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Config missing: GOOGLE_REDIRECT_URI")

    return await google.authorize_redirect(
        request, settings.GOOGLE_REDIRECT_URI,
        access_type="offline", prompt="consent"
    )


async def google_login_callback(request: Request, response: Response, db: Session):
    """
    Hàm callback chính: Điều phối luồng xử lý.
    """
    userinfo = await _fetch_google_user_info(request)
    desired_role = _get_desired_role(request)

    target_user = None
    redirect_url = FRONTEND_BUYER_HOMEPAGE

    # 3. Tìm hoặc Tạo User trong DB
    if desired_role == "seller":
        target_user = await _get_or_create_seller(db, userinfo)
        redirect_url = FRONTEND_SELLER_HOMEPAGE
    else:
        target_user = await _get_or_create_buyer(db, userinfo)
        redirect_url = FRONTEND_BUYER_HOMEPAGE

    # 4. Cấp Token ứng dụng (JWT)
    token_data = issue_token(email=target_user.email, role=desired_role)

    # 5. Trả về Redirect + Set Cookie
    redirect_response = RedirectResponse(url=redirect_url, status_code=302)

    redirect_response.set_cookie(
        key="access_token",
        value=token_data.access_token,
        max_age=token_data.expires_in,
        httponly=True,
        samesite="lax",
        secure=False  # True nếu chạy HTTPS
    )

    return redirect_response