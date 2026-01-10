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
    """**Lấy thông tin định danh của người dùng hiện tại.**"""
    # Hàm này chỉ đọc thông tin từ token (dict) đã decode ở middleware
    # Không gọi DB nên giữ nguyên def thường
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
async def register_buyer(
        payload: RegisterBuyer,
        service: AuthService = Depends(get_auth_service)
):
    """
    **Đăng ký tài khoản Người mua (Buyer).**

    Hệ thống sẽ kiểm tra email duy nhất và mã hóa mật khẩu trước khi lưu trữ.
    """
    # [ASYNC] Phải await vì service gọi DB async
    return await service.register_buyer(payload)


@router.post("/register/seller", response_model=SellerResponse)
async def register_seller(
        payload: RegisterSeller,
        service: AuthService = Depends(get_auth_service)
):
    """**Đăng ký tài khoản Nhà bán hàng (Seller).**"""
    return await service.register_seller(payload)


@router.post("/login/admin", response_model=OAuth2Token)
async def login_admin(
        payload: Login,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    """
    ***Đăng nhập dành cho Admin.**
    """
    token_data = await service.login_admin(payload)
    set_auth_cookies(response, token_data.access_token, token_data.refresh_token)
    return token_data


@router.post("/login/buyer", response_model=OAuth2Token)
async def login_buyer(
        payload: Login,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    """
    **Đăng nhập dành cho Người mua.**
    """
    token_data = await service.login_buyer(payload)
    set_auth_cookies(response, token_data.access_token, token_data.refresh_token)
    return token_data


@router.post("/login/seller", response_model=OAuth2Token)
async def login_seller(
        payload: Login,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    """
   **Đăng nhập dành cho Người bán.**
    """
    token_data = await service.login_seller(payload)
    set_auth_cookies(response, token_data.access_token, token_data.refresh_token)
    return token_data


@router.post("/refresh", response_model=OAuth2Token)
async def refresh(
        request: Request,
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    """Cấp lại Access Token mới từ Refresh Token"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing in cookie"
        )

    new_token = await service.refresh_access_token(refresh_token)

    set_auth_cookies(response, new_token.access_token, new_token.refresh_token)
    return new_token


@router.post("/logout")
def logout(
        response: Response,
        service: AuthService = Depends(get_auth_service)
):
    """Đăng xuất: Xóa cookie"""
    # Hàm logout trong service là @staticmethod và chỉ xóa cookie, không gọi DB
    # Nên giữ nguyên def thường để tối ưu
    return service.logout(response)


@router.get("/google/login/buyer")
async def google_login_buyer(
        request: Request,
        service: GoogleAuthService = Depends(get_google_auth_service)
):
    """
    **Đăng nhập dành cho Người mua bằng google.**
    """
    return await service.login_start(request, role="buyer")


@router.get("/google/login/seller")
async def google_login_seller(
        request: Request,
        service: GoogleAuthService = Depends(get_google_auth_service)
):
    """
    **Đăng nhập dành cho Người bán bằng google.**
    """
    return await service.login_start(request, role="seller")


@router.get("/google/callback")
async def google_callback(
        request: Request,
        service: GoogleAuthService = Depends(get_google_auth_service)
):
    """
    **Xử lý kết quả từ Google.**

    Google sẽ gửi mã xác thực về đây, hệ thống sẽ tiến hành tạo tài khoản hoặc đăng nhập và cấp Token.
    """
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

    # Hàm này trong Service là @staticmethod và tính toán CPU (hash compare)
    # Không gọi DB -> Giữ nguyên def thường để FastAPI chạy trong Threadpool
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