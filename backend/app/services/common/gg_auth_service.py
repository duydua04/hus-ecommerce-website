import uuid

from fastapi import HTTPException, Request, Response
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuthError

from ...utils.google_auth import google
from ...config.settings import settings
from ...models.users import Buyer, Seller
from ...utils.security import hash_password
from .auth_service import issue_token
from starlette.responses import RedirectResponse

ALLOWED_ROLES = {"buyer", "seller"}
# URL trang chu
FRONTEND_BUYER_HOMEPAGE = "/"
FRONTEND_SELLER_HOMEPAGE = "/seller/products"

async def google_login_start(request: Request, role: str):
    """
    Ham nay xu ly viec bat dau qua trinh den Google Oauth
    Kiem tra role: Chi cho phep buyer va seller dang nhap bang google
    Sau do luu role vao session
    """
    desired_role = (role or "buyer").lower()
    if desired_role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role (use buyer or seller)")

    request.session["oauth_target_role"] = desired_role

    redirect_uri = settings.GOOGLE_REDIRECT_URI
    if not redirect_uri:
        raise HTTPException(status_code=500, detail="GOOGLE_REDIRECT_URI is not configured")

    return await google.authorize_redirect(
        request, redirect_uri,
        access_type="offline",
        prompt="consent"
    )


async def google_login_callback(request: Request, response: Response, db: Session):
    """
    Xử lý callback từ Google.
    """

    # Lay token tu google
    try:
        token = await google.authorize_access_token(request)
    except OAuthError as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")

    # thuc hien lay thong tin user
    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="Missing userinfo from Google")

    email = userinfo.get("email")
    given_name = userinfo.get("given_name") or (email.split("@")[0] if email else "")
    family_name = userinfo.get("family_name") or ""
    picture = userinfo.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # --- 3. Lấy vai trò mong muốn (đã lưu ở bước login_start) ---
    desired_role = request.session.get("oauth_target_role", "buyer")

    token_data = None
    redirect_url = FRONTEND_BUYER_HOMEPAGE  # Mac dinh la trang chu cua nguoi mua

    # Tim user neu chua co thuc hien tao user
    if desired_role == "seller":
        seller = db.query(Seller).filter(Seller.email == email).first()

        if not seller:
            # Neu la buyer thi khong cho dang nhap seller
            buyer = db.query(Buyer).filter(Buyer.email == email).first()
            if buyer:
                raise HTTPException(status_code=400, detail="Email already exists as a buyer")

            # Tạo Seller mới
            new_seller = Seller(
                email=email,
                phone=None,
                fname=given_name,
                lname=family_name,
                password=hash_password(str(uuid.uuid4())),
                shop_name=f"{given_name} Store",
                avt_url=picture,
            )
            db.add(new_seller)
            db.commit()
            db.refresh(new_seller)
            seller = new_seller

        token_data = issue_token(email=seller.email, role="seller")
        redirect_url = FRONTEND_SELLER_HOMEPAGE

    else:
        buyer = db.query(Buyer).filter(Buyer.email == email).first()

        if not buyer:
            # Neu la seller khong cho dang nhap buyer
            seller = db.query(Seller).filter(Seller.email == email).first()
            if seller:
                raise HTTPException(status_code=400, detail="Email already exists as a seller.")

            # Tạo Buyer mới
            new_buyer = Buyer(
                email=email,
                phone=None,
                fname=given_name,
                lname=family_name,
                password=hash_password("oauth-google-placeholder"),
                avt_url=picture,
            )
            db.add(new_buyer)
            db.commit()
            db.refresh(new_buyer)
            buyer = new_buyer

        token_data = issue_token(email=buyer.email, role="buyer")
        redirect_url = FRONTEND_BUYER_HOMEPAGE


    redirect_response = RedirectResponse(url=redirect_url, status_code=302)

    redirect_response.set_cookie(
        key="access_token",
        value=token_data.access_token,  # <--- SỬA: BỎ "Bearer " ĐI, CHỈ LẤY TOKEN
        max_age=token_data.expires_in,
        httponly=True,
        samesite="lax",
        secure=False  # Đặt True nếu deploy HTTPS
    )

    return redirect_response