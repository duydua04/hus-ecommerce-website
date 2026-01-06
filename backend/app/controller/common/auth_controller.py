from fastapi import APIRouter, Depends, HTTPException, Request, Response, BackgroundTasks, status
from ...config import public_url
from ...middleware.auth import get_current_user

from ...schemas.auth import (
    RegisterBuyer, RegisterSeller, Login, OAuth2Token,
    ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest
)
from ...schemas.user import BuyerResponse, SellerResponse

from ...services.common.auth_service import AuthService, get_auth_service
from ...services.common.gg_auth_service import GoogleAuthService, get_google_auth_service

from ...utils.security import set_auth_cookies, delete_auth_cookies
import os

IS_PRODUCTION = os.getenv("e") == "production"
router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.get("/me")
def get_me(info=Depends(get_current_user)):
    u = info["user"]
    return {
        "role": info["role"],
        "email": u.email,
        "fname": u.fname,
        "lname": getattr(u, "lname", None),
        "avt_url": public_url(getattr(u, "avt_url", None)),
        "id": getattr(u, "buyer_id", getattr(u, "seller_id", getattr(u, "admin_id", None)))
    }


@router.post("/register/buyer", response_model=BuyerResponse)
async def register_buyer(payload: RegisterBuyer, service: AuthService = Depends(get_auth_service)):
    return await service.register_buyer(payload)


@router.post("/register/seller", response_model=SellerResponse)
async def register_seller(payload: RegisterSeller, service: AuthService = Depends(get_auth_service)):
    return await service.register_seller(payload)


@router.post("/login/admin", response_model=OAuth2Token)
async def login_admin(
        payload: Login,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    token_data = await service.login_admin(payload)
    set_auth_cookies(response, token_data.access_token, token_data.refresh_token, role="admin")
    return token_data


@router.post("/login/buyer", response_model=OAuth2Token)
async def login_buyer(
        payload: Login,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    token_data = await service.login_buyer(payload)
    set_auth_cookies(response, token_data.access_token, token_data.refresh_token, role="buyer")
    return token_data


@router.post("/login/seller", response_model=OAuth2Token)
async def login_seller(
        payload: Login,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    token_data = await service.login_seller(payload)
    set_auth_cookies(response, token_data.access_token, token_data.refresh_token, role="seller")
    return token_data


@router.post("/refresh", response_model=OAuth2Token)
async def refresh(
        request: Request,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    host = request.headers.get("host", "").lower()

    if "admin.fastbuy.io.vn" in host:
        role = "admin"
    elif "seller.fastbuy.io.vn" in host:
        role = "seller"
    else:
        role = "buyer"

    refresh_token = request.cookies.get(f"refresh_token_{role}")

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token expired")

    new_token = await service.refresh_access_token(refresh_token)

    set_auth_cookies(response, new_token.access_token, new_token.refresh_token, role=role)

    return new_token


@router.post("/logout")
def logout(response: Response, service: AuthService = Depends(get_auth_service), role: str = None):
    """Đăng xuất: Xóa sạch cookie"""
    return service.logout(response, role)


@router.get("/google/login/buyer")
async def google_login_buyer(request: Request, service: GoogleAuthService = Depends(get_google_auth_service)):
    return await service.login_start(request, role="buyer")


@router.get("/google/login/seller")
async def google_login_seller(request: Request, service: GoogleAuthService = Depends(get_google_auth_service)):
    return await service.login_start(request, role="seller")


@router.get("/google/callback")
async def google_callback(request: Request, service: GoogleAuthService = Depends(get_google_auth_service)):
    return await service.login_callback(request)


@router.post("/forgot-password")
async def forgot_password(
        payload: ForgotPasswordRequest,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    """Gửi OTP qua email"""
    # [ASYNC] Phải await vì cần tìm user trong DB
    result = await service.forgot_password_request(payload.email, payload.role)

    response.set_cookie(
        key="reset_token",
        value=result["reset_token"],
        httponly=True,
        samesite="lax",
        secure=IS_PRODUCTION,
        max_age=5 * 60,
        domain=".fastbuy.io.vn" if IS_PRODUCTION else None
    )
    return {"message": "OTP has been sent to your email"}


@router.post("/verify-otp")
def verify_otp(
        payload: VerifyOTPRequest,
        request: Request,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    """Kiểm tra OTP"""
    token = request.cookies.get("reset_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session missing or expired"
        )


    result = service.verify_otp_for_reset(payload.otp, token)

    response.set_cookie(
        key="reset_token",
        value=result["permission_token"],
        httponly=True,
        samesite="lax",
        secure=IS_PRODUCTION,
        max_age=5 * 60,
        domain=".fastbuy.io.vn" if IS_PRODUCTION else None
    )
    return {"message": "OTP valid, you can now reset password"}


@router.post("/reset-password")
async def reset_password(
        payload: ResetPasswordRequest,
        request: Request,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    """Đổi mật khẩu mới"""
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )

    token = request.cookies.get("reset_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session missing"
        )

    result = await service.reset_password_final(payload.new_password, token)

    response.delete_cookie("reset_token")

    return result