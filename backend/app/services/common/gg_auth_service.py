from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuthError

from ...utils.google_auth import google
from ...config.settings import settings
from ...models.users import Admin, Buyer, Seller
from ...utils.security import hash_password
from .auth_service import issue_token

ALLOWED_ROLES = {"buyer", "seller"}

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

    # Có thể thêm access_type/prompt ở đây nếu muốn refresh_token
    return await google.authorize_redirect(
        request, redirect_uri,
        access_type="offline",   # nhận refresh_token
        prompt="consent"         # ép consent (tùy nhu cầu)
    )

async def google_login_callback(request: Request, db: Session):
    """
    Xu ly callback tu phai google
    """
    try:
        token = await google.authorize_access_token(request)
    except OAuthError as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="Missing userinfo from Google")

    email = userinfo.get("email")
    given_name = userinfo.get("given_name") or (email.split("@")[0] if email else "")
    family_name = userinfo.get("family_name") or ""
    picture = userinfo.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    desired_role = request.session.get("oauth_target_role", "buyer")

    # Ưu tiên giữ đúng vai trò nếu đã tồn tại
    admin = db.query(Admin).filter(Admin.email == email).first()
    if admin:
        return issue_token(email=admin.email, role="admin")

    seller = db.query(Seller).filter(Seller.email == email).first()
    buyer  = db.query(Buyer ).filter(Buyer .email == email).first()

    if desired_role == "seller":
        if seller:
            return issue_token(email=seller.email, role="seller")
        new_seller = Seller(
            email=email, phone="", fname=given_name, lname=family_name,
            password=hash_password("oauth-google-placeholder"),
            shop_name=f"{given_name or 'Shop'} Store", avt_url=picture,
        )
        db.add(new_seller); db.commit(); db.refresh(new_seller)
        return issue_token(email=new_seller.email, role="seller")

    # desired_role == "buyer" (mặc định)
    if buyer:
        return issue_token(email=buyer.email, role="buyer")

    new_buyer = Buyer(
        email=email, phone="", fname=given_name, lname=family_name,
        password=hash_password("oauth-google-placeholder"), avt_url=picture,
    )
    db.add(new_buyer); db.commit(); db.refresh(new_buyer)
    return issue_token(email=new_buyer.email, role="buyer")
