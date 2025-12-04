from fastapi import HTTPException, status, Response, Depends
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...config.settings import settings
from ...models.users import Admin, Seller, Buyer

from ...schemas.auth import RegisterBuyer, RegisterSeller, Login, OAuth2Token
from ...schemas.user import BuyerResponse, SellerResponse
from ...utils.security import (
    hash_password, verify_password, create_access_token,
    verify_refresh_token, decode_token, issue_token
)
from ...utils.email import email_service
from ...utils.otp import create_otp

from ..admin.admin_notification_service import AdminNotificationService, get_admin_notif_service


class AuthService:
    def __init__(self, db: Session, notif_service: AdminNotificationService):
        self.db = db
        self.notif_service = notif_service


    def _email_or_phone_taken(self, model, email: str, phone: str):
        return self.db.query(model).filter(
            (model.email == email) | (model.phone == phone)
        ).first() is not None


    async def register_buyer(self, payload: RegisterBuyer):
        if self._email_or_phone_taken(Buyer, payload.email, payload.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or phone already registered"
            )

        buyer = Buyer(
            email=payload.email, phone=payload.phone, fname=payload.fname, lname=payload.lname,
            password=hash_password(payload.password)
        )
        self.db.add(buyer)
        self.db.commit()
        self.db.refresh(buyer)

        # Gọi Notification Service
        await self.notif_service.notify_new_buyer_registration(buyer)

        return BuyerResponse.model_validate(buyer)


    async def register_seller(self, payload: RegisterSeller):
        if self._email_or_phone_taken(Seller, payload.email, payload.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or phone already registered"
            )

        seller = Seller(
            email=payload.email, phone=payload.phone, fname=payload.fname, lname=payload.lname,
            password=hash_password(payload.password), shop_name=payload.shop_name
        )

        self.db.add(seller)
        self.db.commit()
        self.db.refresh(seller)

        # Gọi Notification Service
        await self.notif_service.notify_new_seller_registration(seller)

        return SellerResponse.model_validate(seller)


    def login_admin(self, payload: Login):
        admin = self.db.query(Admin) \
                 .filter(Admin.email == payload.email) \
                 .first()

        if not admin or not verify_password(payload.password, admin.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        return issue_token(admin.email, "admin")


    def login_buyer(self, payload: Login):
        buyer = (self.db.query(Buyer)
                 .filter(Buyer.email == payload.email)
                 .first()
        )

        if not buyer or not verify_password(payload.password, buyer.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        return issue_token(buyer.email, "buyer")


    def login_seller(self, payload: Login):
        seller = (self.db.query(Seller)
                  .filter(Seller.email == payload.email)
                  .first()
        )

        if not seller or not verify_password(payload.password, seller.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        return issue_token(seller.email, "seller")


    def refresh_access_token(self, refresh_token: str):
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
        if role == 'admin':
            user = self.db.query(Admin).filter(Admin.email == email).first()
        elif role == 'buyer':
            user = self.db.query(Buyer).filter(Buyer.email == email).first()
        elif role == 'seller':
            user = self.db.query(Seller).filter(Seller.email == email).first()

        if not user: raise HTTPException(
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
        if role == 'admin':
            user = self.db.query(Admin).filter(Admin.email == email).first()
        elif role == 'buyer':
            user = self.db.query(Buyer).filter(Buyer.email == email).first()
        elif role == 'seller':
            user = self.db.query(Seller).filter(Seller.email == email).first()

        if not user: raise HTTPException(status_code=404, detail="User not found")

        otp_code = create_otp()
        otp_hash = hash_password(otp_code)
        firstname = getattr(user, "fname", email)

        # Gọi Email Service
        await email_service.send_otp_email(email, firstname, otp_code)

        reset_token = create_access_token(
            sub=email,
            role=role,
            expires_minutes=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES,
            extra={"type": "reset_waiting", "otp_hash": otp_hash}
        )

        return {"message": "OTP sent", "reset_token": reset_token}

    @staticmethod
    def verify_otp_for_reset(otp_input: str, reset_token: str):
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


    def reset_password_final(self, new_password: str, permission_token: str):
        try:
            payload = decode_token(permission_token)
            if payload.get("type") != "reset_allowed": raise Exception()
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session expired"
            )

        email, role = payload.get("sub"), payload.get("role")

        if role == 'admin':
            user = self.db.query(Admin).filter(Admin.email == email).first()
        elif role == 'buyer':
            user = self.db.query(Buyer).filter(Buyer.email == email).first()
        elif role == 'seller':
            user = self.db.query(Seller).filter(Seller.email == email).first()

        if not user: raise HTTPException(404, "User not found")

        user.password = hash_password(new_password)
        self.db.commit()
        return {"message": "Password reset successfully"}


def get_auth_service(
        db: Session = Depends(get_db),
        notif_service: AdminNotificationService = Depends(get_admin_notif_service)
):
    return AuthService(db, notif_service)