from fastapi import HTTPException, status, Response, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from ...config.db import get_db
from ...config.settings import settings
from ...models.users import Admin, Seller, Buyer

from ...schemas.auth import RegisterBuyer, RegisterSeller, Login
from ...schemas.user import BuyerResponse, SellerResponse
from ...utils.security import (
    hash_password, verify_password, create_access_token,
    verify_refresh_token, decode_token, issue_token
)
from ...utils.otp import create_otp
from ...tasks.email_task import send_otp_email_task

from ...tasks.dashboard_task import task_admin_sync_user
from ...tasks.notification_task import task_broadcast_admin_notification


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _email_or_phone_taken(self, model, email: str, phone: str):
        stmt = select(model).where(
            or_(model.email == email, model.phone == phone)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None


    async def register_buyer(self, payload: RegisterBuyer):
        if await self._email_or_phone_taken(Buyer, payload.email, payload.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or phone already registered"
            )

        buyer = Buyer(
            email=payload.email, phone=payload.phone, fname=payload.fname, lname=payload.lname,
            password=hash_password(payload.password)
        )
        self.db.add(buyer)
        await self.db.commit()
        await self.db.refresh(buyer)

        task_admin_sync_user.delay("buyer", "add")
        task_broadcast_admin_notification.delay(
            title="Khách hàng mới",
            message=f"Khách hàng {buyer.fname} {buyer.lname} vừa đăng ký.",
            event_type="new_user_registered",
            data={
                "user_id": buyer.buyer_id,
                "role": "buyer",
                "email": buyer.email,
                "action": "view_detail"
            }
        )

        return BuyerResponse.model_validate(buyer)


    async def register_seller(self, payload: RegisterSeller):
        if await self._email_or_phone_taken(Seller, payload.email, payload.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or phone already registered"
            )

        seller = Seller(
            email=payload.email, phone=payload.phone, fname=payload.fname, lname=payload.lname,
            password=hash_password(payload.password), shop_name=payload.shop_name
        )

        self.db.add(seller)
        await self.db.commit()
        await self.db.refresh(seller)

        task_admin_sync_user.delay("seller", "add")
        task_broadcast_admin_notification.delay(
            title="Đối tác bán hàng mới",
            message=f"Gian hàng {seller.shop_name} vừa đăng ký gia nhập sàn.",
            event_type="new_user_registered",
            data={
                "user_id": seller.seller_id,
                "role": "seller",
                "email": seller.email,
                "shop_name": seller.shop_name,
            }
        )

        return SellerResponse.model_validate(seller)


    async def login_admin(self, payload: Login):
        stmt = select(Admin).where(Admin.email == payload.email)
        result = await self.db.execute(stmt)
        admin = result.scalar_one_or_none()

        if not admin or not verify_password(payload.password, admin.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        token_data = issue_token(admin.email, "admin")
        admin_id_value = getattr(admin, "admin_id", None)
        token_data.admin_id = admin_id_value

        return token_data


    async def login_buyer(self, payload: Login):
        stmt = select(Buyer).where(Buyer.email == payload.email)
        result = await self.db.execute(stmt)
        buyer = result.scalar_one_or_none()

        if not buyer or not verify_password(payload.password, buyer.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        token_data = issue_token(buyer.email, "buyer")
        buyer_id_value = getattr(buyer, "buyer_id", None)
        token_data.buyer_id = buyer_id_value

        return token_data


    async def login_seller(self, payload: Login):
        stmt = select(Seller).where(Seller.email == payload.email)
        result = await self.db.execute(stmt)
        seller = result.scalar_one_or_none()

        if not seller or not verify_password(payload.password, seller.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        token_data = issue_token(seller.email, "seller")
        seller_id_value = getattr(seller, "seller_id", None)
        token_data.seller_id = seller_id_value

        return token_data


    async def refresh_access_token(self, refresh_token: str):
        try:
            payload = verify_refresh_token(refresh_token)
        except:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        email, role = payload.get("sub"), payload.get("role")

        # Check User Exist
        user = None
        stmt = None

        if role == 'buyer':
            stmt = select(Buyer).where(Buyer.email == email)
        elif role == 'seller':
            stmt = select(Seller).where(Seller.email == email)
        elif role == 'admin':
            stmt = select(Admin).where(Admin.email == email)

        if stmt is not None:
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return issue_token(email, role)


    @staticmethod
    def logout(response: Response):

        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/auth/refresh")

        return {"message": "Logout successfully"}

    async def forgot_password_request(self, email: str, role: str):
        user = None
        stmt = None

        if role == 'buyer':
            stmt = select(Buyer).where(Buyer.email == email)
        elif role == 'seller':
            stmt = select(Seller).where(Seller.email == email)

        if stmt is not None:
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        otp_code = create_otp()
        otp_hash = hash_password(otp_code)

        firstname = getattr(user, "fname", email)

        send_otp_email_task.delay(email, firstname, otp_code)

        reset_token = create_access_token(
            sub=email,
            role=role,
            expires_minutes=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES,
            extra={"type": "reset_waiting", "otp_hash": otp_hash}
        )

        return {"message": "OTP sent", "reset_token": reset_token}


    @staticmethod
    def verify_otp_for_reset(otp_input: str, reset_token: str):
        # Logic tính toán thuần túy, giữ nguyên Sync
        try:
            payload = decode_token(reset_token)
            if payload.get("type") != "reset_waiting":
                raise Exception()
            if not verify_password(otp_input, payload.get("otp_hash")):
                raise Exception()
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP or Token"
            )

        return {
            "message": "OTP verified",
            "permission_token": create_access_token(
                sub=payload.get("sub"),
                role=payload.get("role"),
                expires_minutes=5,
                extra={"type": "reset_allowed"}
            )
        }


    async def reset_password_final(self, new_password: str, permission_token: str):
        try:
            payload = decode_token(permission_token)
            if payload.get("type") != "reset_allowed": raise Exception()
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session expired"
            )

        email, role = payload.get("sub"), payload.get("role")
        user = None
        stmt = None

        if role == 'buyer':
            stmt = select(Buyer).where(Buyer.email == email)
        elif role == 'seller':
            stmt = select(Seller).where(Seller.email == email)

        if stmt is not None:
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user.password = hash_password(new_password)
        await self.db.commit()

        return {"message": "Password reset successfully"}


def get_auth_service(
        db: AsyncSession = Depends(get_db)
):
    return AuthService(db)