import uuid
from fastapi import HTTPException, Request, Response, status, Depends
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuthError
from starlette.responses import RedirectResponse

from ...config.google_auth import google
from ...config.settings import settings
from ...config.db import get_db
from ...models.users import Buyer, Seller

from ...utils.security import hash_password, issue_token, set_auth_cookies

from ..admin.admin_notification_service import AdminNotificationService, get_admin_notif_service


ALLOWED_ROLES = {"buyer", "seller"}
FRONTEND_BUYER_HOMEPAGE = "/"
FRONTEND_SELLER_HOMEPAGE = "/seller/products"


class GoogleAuthService:

    def __init__(self, db: Session, notif_service: AdminNotificationService):
        self.db = db
        self.notif_service = notif_service


    @staticmethod
    async def _fetch_google_user_info(request: Request):
        """Trao đổi Code lấy Token và UserInfo từ Google"""
        try:
            token = await google.authorize_access_token(request)
        except OAuthError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"OAuth error: {str(e)}"
            )

        userinfo = token.get("userinfo")
        if not userinfo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing userinfo from Google"
            )

        if not userinfo.get("email"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account has no email"
            )

        return userinfo


    @staticmethod
    def _get_desired_role(request: Request):
        """Lấy role user đã chọn từ Session"""
        return request.session.get("oauth_target_role", "buyer")


    async def _get_or_create_buyer(self, user_info: dict):
        email = user_info.get("email")

        if self.db.query(Seller).filter(Seller.email == email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email này đã được đăng ký là Seller, không thể đăng nhập Buyer."
            )

        buyer = self.db.query(Buyer).filter(Buyer.email == email).first()

        # Nếu chưa có thi tạo mới
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
            self.db.add(new_buyer)
            self.db.commit()
            self.db.refresh(new_buyer)

            await self.notif_service.notify_new_buyer_registration(new_buyer)

            return new_buyer

        return buyer


    async def _get_or_create_seller(self, user_info: dict):
        email = user_info.get("email")

        # Nếu email này đã là Buyer thì không cho đăng nhập Seller
        if self.db.query(Buyer).filter(Buyer.email == email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email này đã được đăng ký là Buyer, không thể đăng nhập Seller."
            )

        seller = self.db.query(Seller).filter(Seller.email == email).first()

        # Nếu chưa có -> Tạo mới
        if not seller:
            fname = user_info.get("given_name", "")
            new_seller = Seller(
                email=email,
                phone=None,
                fname=fname,
                lname=user_info.get("family_name", ""),
                password=hash_password(str(uuid.uuid4())),
                shop_name=f"{fname} Store",  # Tên shop mặc định
                avt_url=user_info.get("picture"),
                is_active=True
            )
            self.db.add(new_seller)
            self.db.commit()
            self.db.refresh(new_seller)

            await self.notif_service.notify_new_seller_registration(new_seller)

            return new_seller

        return seller

    @staticmethod
    async def login_start(request: Request, role: str):
        """Bước 1: Redirect sang Google"""
        desired_role = (role or "buyer").lower()
        if desired_role not in ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")

        # Lưu role vào session để dùng lại ở bước callback
        request.session["oauth_target_role"] = desired_role

        if not settings.GOOGLE_REDIRECT_URI:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Config missing: GOOGLE_REDIRECT_URI"
            )

        return await google.authorize_redirect(
            request, settings.GOOGLE_REDIRECT_URI,
            access_type="offline", prompt="consent"
        )

    async def login_callback(self, request: Request, response: Response):
        """Bước 2: Xử lý dữ liệu Google trả về"""
        # 1. Lấy thông tin
        userinfo = await self._fetch_google_user_info(request)
        role = self._get_desired_role(request)

        target_user = None
        redirect_url = FRONTEND_BUYER_HOMEPAGE

        # 2. Xử lý User theo Role
        if role == "seller":
            target_user = await self._get_or_create_seller(userinfo)
            redirect_url = FRONTEND_SELLER_HOMEPAGE
        else:
            target_user = await self._get_or_create_buyer(userinfo)
            redirect_url = FRONTEND_BUYER_HOMEPAGE

        # 3. Cấp Token (Dùng hàm tiện ích chung)
        token_data = issue_token(email=target_user.email, role=role)

        # 4. Tạo Redirect & Set Cookie
        redirect_response = RedirectResponse(url=redirect_url, status_code=302)

        set_auth_cookies(
            redirect_response,
            token_data.access_token,
            token_data.refresh_token
        )

        return redirect_response


def get_google_auth_service(
        db: Session = Depends(get_db),
        notif_service: AdminNotificationService = Depends(get_admin_notif_service)
):
    return GoogleAuthService(db, notif_service)