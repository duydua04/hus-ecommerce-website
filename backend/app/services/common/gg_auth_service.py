import uuid
import json
import base64
from fastapi import HTTPException, Request, status, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession  # <--- Thay đổi import
from sqlalchemy import select  # <--- Thêm import select
from authlib.integrations.starlette_client import OAuthError
from starlette.responses import RedirectResponse

from ...config.google_auth import google
from ...config.settings import settings
from ...config.db import get_db
from ...models.users import Buyer, Seller
from ...utils.security import hash_password, issue_token, set_auth_cookies
from ..admin.admin_notification_service import AdminNotificationService, get_admin_notif_service

ALLOWED_ROLES = {"buyer", "seller"}


class GoogleAuthService:

    def __init__(self, db: AsyncSession, notif_service: AdminNotificationService):
        self.db = db
        self.notif_service = notif_service

    @staticmethod
    def _encode_state(role: str, next_url: str) -> str:
        """
        Mã hóa role và next_url thành chuỗi state để gửi sang Google.
        (Giữ nguyên logic cũ)
        """
        payload = {
            "role": role,
            "next": next_url,
            "nonce": str(uuid.uuid4())
        }
        json_str = json.dumps(payload)

        return base64.urlsafe_b64encode(json_str.encode()).decode()

    @staticmethod
    def _decode_state(state_str: str) -> dict:
        """Giải mã state nhận về từ Google (Giữ nguyên logic cũ)"""
        try:
            if not state_str:
                return {}
            json_str = base64.urlsafe_b64decode(state_str).decode()
            return json.loads(json_str)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth state"
            )

    @staticmethod
    async def _fetch_google_user_info(request: Request):
        """Giữ nguyên logic cũ (authlib hỗ trợ async sẵn)"""
        try:
            token = await google.authorize_access_token(request)
        except OAuthError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"OAuth error: {str(e)}"
            )

        userinfo = token.get("userinfo")
        if not userinfo or not userinfo.get("email"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account has no email"
            )

        return userinfo

    async def _get_or_create_buyer(self, user_info: dict):
        """
        Trả về: (UserObject, is_new_user)
        """
        email = user_info.get("email")

        # 1. Check conflict logic (Async)
        # Cũ: self.db.query(Seller).filter(...).first()
        stmt_check_seller = select(Seller).where(Seller.email == email)
        result_seller = await self.db.execute(stmt_check_seller)

        if result_seller.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email này đã là Seller, không thể đăng nhập Buyer."
            )

        # 2. Tìm Buyer (Async)
        stmt_buyer = select(Buyer).where(Buyer.email == email)
        result_buyer = await self.db.execute(stmt_buyer)
        buyer = result_buyer.scalar_one_or_none()

        # 3. Logic tạo mới
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
            await self.db.commit()  # <--- Async Commit
            await self.db.refresh(new_buyer)  # <--- Async Refresh

            return new_buyer, True

        return buyer, False

    async def _get_or_create_seller(self, user_info: dict):
        email = user_info.get("email")

        # 1. Check conflict (Async)
        stmt_check_buyer = select(Buyer).where(Buyer.email == email)
        result_buyer = await self.db.execute(stmt_check_buyer)

        if result_buyer.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email này đã là Buyer, không thể đăng nhập Seller."
            )

        # 2. Tìm Seller (Async)
        stmt_seller = select(Seller).where(Seller.email == email)
        result_seller = await self.db.execute(stmt_seller)
        seller = result_seller.scalar_one_or_none()

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
            self.db.add(new_seller)
            await self.db.commit()  # <--- Async Commit
            await self.db.refresh(new_seller)  # <--- Async Refresh

            return new_seller, True

        return seller, False

    async def login_start(self, request: Request, role: str, next_url: str = None):
        """
        Bước 1: Redirect sang Google (Giữ nguyên logic cũ)
        """
        desired_role = (role or "buyer").lower()
        if desired_role not in ALLOWED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )

        if not settings.GOOGLE_REDIRECT_URI:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Config missing: GOOGLE_REDIRECT_URI"
            )

        if next_url and not next_url.startswith("/"):
            next_url = None

        # Gói data vào state
        custom_state = self._encode_state(desired_role, next_url)

        return await google.authorize_redirect(
            request,
            settings.GOOGLE_REDIRECT_URI,
            access_type="offline",
            prompt="consent",
            state=custom_state
        )

    async def login_callback(self, request: Request, background_tasks: BackgroundTasks):
        """
        Xử lý khi Google trả về (Callback)
        """
        # Trao đổi lấy User Info
        userinfo = await self._fetch_google_user_info(request)

        # Giải mã State để biết Role và Next URL
        state_str = request.query_params.get("state")
        state_data = self._decode_state(state_str)

        role = state_data.get("role", "buyer")
        next_path = state_data.get("next")

        # Tìm hoặc Tạo User (Đã đổi thành Async)
        target_user = None
        is_new = False
        base_frontend_url = ""
        default_home = ""

        if role == "seller":
            target_user, is_new = await self._get_or_create_seller(userinfo)
            base_frontend_url = settings.FRONTEND_SELLER_URL
            default_home = settings.DEFAULT_SELLER_HOME
        else:
            target_user, is_new = await self._get_or_create_buyer(userinfo)
            base_frontend_url = settings.FRONTEND_BUYER_URL
            default_home = settings.DEFAULT_BUYER_HOME

        # --- LOGIC THÔNG BÁO GIỮ NGUYÊN (BackgroundTasks) ---
        if is_new:
            if role == "seller":
                background_tasks.add_task(
                    self.notif_service.notify_new_seller_registration,
                    target_user
                )
            else:
                background_tasks.add_task(
                    self.notif_service.notify_new_buyer_registration,
                    target_user
                )

        # 5. Xây dựng URL Redirect (Giữ nguyên)
        final_path = next_path if next_path else default_home
        if not final_path.startswith("/"):
            final_path = "/" + final_path

        absolute_redirect_url = f"{base_frontend_url}{final_path}"

        # 6. Cấp Token & Cookie (Giữ nguyên)
        token_data = issue_token(email=target_user.email, role=role)

        redirect_response = RedirectResponse(
            url=absolute_redirect_url,
            status_code=status.HTTP_302_FOUND
        )

        set_auth_cookies(redirect_response, token_data.access_token, token_data.refresh_token)

        return redirect_response


def get_google_auth_service(
        db: AsyncSession = Depends(get_db),  # <--- Inject AsyncSession
        notif_service: AdminNotificationService = Depends(get_admin_notif_service)
):
    return GoogleAuthService(db, notif_service)