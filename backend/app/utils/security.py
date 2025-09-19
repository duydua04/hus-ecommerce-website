import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import bcrypt, jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from ..config.settings import settings

# ===== Password hashing =====
def hash_password(plain: str):
    """Hàm băm mật khẩu thô thành hash đê lưu vào database"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str):
    """So khớp mật khẩu nhập với hash trong DB."""
    if not hashed or not plain:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(sub: str, role: str, expires_minutes: int | None = None, extra: Dict[str, Any] | None = None):
    """
    Tạo OAuth access token để xác thực người dùng trong các request tiếp theo,
    sub va role la thong tin xax thuc de xac dinh nguoi dung khi nguoi dung goi API
    """
    if expires_minutes is None:
        expires_minutes = int(getattr(settings, "OAUTH2_ACCESS_TOKEN_EXPIRE_MINUTES", 180))
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    if extra:
        payload.update(extra)

    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)
    return token


def create_refresh_token(sub: str, role: str, expires_days: int | None = None):
    """
    Tạo OAuth2 refresh token để làm mới access token khi hết hạn
    """
    if expires_days is None:
        expires_days = int(getattr(settings, "OAUTH2_REFRESH_TOKEN_EXPIRE_DAYS", 30))

    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=expires_days)).timestamp()),
        "type": "refresh_token",
        "jti": secrets.token_urlsafe(16),
    }

    token = jwt.encode(payload, settings.OAUTH2_SECRET_KEY, algorithm=settings.OAUTH2_ALGORITHM)
    return token

def decode_token(token: str):
    """
    Giải mã và xác thực JWT token, trả về payload chứa thông tin user
    """
    try:
        return jwt.decode(token, settings.OAUTH2_SECRET_KEY, algorithms=[settings.OAUTH2_ALGORITHM])
    except ExpiredSignatureError as e:
        raise e
    except InvalidTokenError as e:
        raise e

def verify_access_token(token: str):
    """Xác thực access token và trả về payload"""
    try:
        payload = decode_token(token)
        if payload.get("type") != "access_token":
            raise InvalidTokenError("Invalid token type")
        return payload
    except (ExpiredSignatureError, InvalidTokenError) as e:
        raise e

def verify_refresh_token(token: str):
    """Xác thực refresh token và trả về payload"""
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh_token":
            raise InvalidTokenError("Invalid token type")
        return payload
    except (ExpiredSignatureError, InvalidTokenError) as e:
        raise e