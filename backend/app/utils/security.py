import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import bcrypt, jwt
from fastapi import Response
from jwt import ExpiredSignatureError, InvalidTokenError
from ..config.settings import settings
from ..schemas.auth import OAuth2Token
import os

IS_PRODUCTION = os.getenv("e") == "production"
ROLES_LIST = ["admin", "buyer", "seller"]

def hash_password(plain: str):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str):
    if not hashed or not plain:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(sub: str, role: str, expires_minutes: int | None = None, extra: Dict[str, Any] | None = None):
    if expires_minutes is None:
        expires_minutes = int(getattr(settings, "OAUTH2_ACCESS_TOKEN_EXPIRE_MINUTES", 180))
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
        "type": "access_token",
    }
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, settings.OAUTH2_SECRET_KEY, algorithm=settings.OAUTH2_ALGORITHM)
    return token

def create_refresh_token(sub: str, role: str, expires_days: int | None = None):
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
    try:
        return jwt.decode(token, settings.OAUTH2_SECRET_KEY, algorithms=[settings.OAUTH2_ALGORITHM])
    except ExpiredSignatureError as e:
        raise e
    except InvalidTokenError as e:
        raise e

def verify_access_token(token: str):
    try:
        payload = decode_token(token)
        if payload.get("type") != "access_token":
            raise InvalidTokenError("Invalid token type")
        return payload
    except (ExpiredSignatureError, InvalidTokenError) as e:
        raise e

def verify_refresh_token(token: str):
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh_token":
            raise InvalidTokenError("Invalid token type")
        return payload
    except (ExpiredSignatureError, InvalidTokenError) as e:
        raise e

def issue_token(email: str, role: str):
    access_expires = settings.OAUTH2_ACCESS_TOKEN_EXPIRE_MINUTES
    refresh_expires = settings.OAUTH2_REFRESH_TOKEN_EXPIRE_DAYS
    access_token = create_access_token(sub=email, role=role, expires_minutes=access_expires)
    refresh_token = create_refresh_token(sub=email, role=role, expires_days=refresh_expires)
    return OAuth2Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=access_expires * 60,
        scope=role
    )

def set_auth_cookies(response: Response, access_token: str, refresh_token: str, role: str):
    """Set token vào HttpOnly Cookie với domain riêng biệt theo Role"""
    access_minutes = settings.OAUTH2_ACCESS_TOKEN_EXPIRE_MINUTES
    refresh_days = settings.OAUTH2_REFRESH_TOKEN_EXPIRE_DAYS

    # Xác định domain cho từng role
    target_domain = None
    if IS_PRODUCTION:
        if role == "seller":
            target_domain = "seller.fastbuy.io.vn"
        elif role == "admin":
            target_domain = "admin.fastbuy.io.vn"
        elif role == "buyer":
            target_domain = "www.fastbuy.io.vn"

    cookie_params = {
        "httponly": True,
        "samesite": "lax",
        "secure": IS_PRODUCTION,
        "domain": target_domain
    }

    response.set_cookie(
        key=f"access_token_{role}",
        value=access_token,
        path="/",
        max_age=access_minutes * 60,
        **cookie_params
    )

    response.set_cookie(
        key=f"refresh_token_{role}",
        value=refresh_token,
        path="/auth/refresh",
        max_age=refresh_days * 24 * 3600,
        **cookie_params
    )

def delete_auth_cookies(response: Response, role: str = None):
    """Xóa cookie với đúng domain"""
    def get_params(domain_name):
        return {
            "httponly": True,
            "samesite": "lax",
            "secure": IS_PRODUCTION,
            "domain": domain_name,
            "path": "/"
        }

    roles = [role] if role else ["admin", "buyer", "seller"]
    for r in roles:
        domain = None
        if IS_PRODUCTION:
            if r == "seller":
                domain = "seller.fastbuy.io.vn"
            elif r == "admin":
                domain = "admin.fastbuy.io.vn"
            elif r == "buyer":
                domain = "www.fastbuy.io.vn"

        response.delete_cookie(key=f"access_token_{r}", **get_params(domain))
        refresh_params = get_params(domain)
        refresh_params["path"] = "/auth/refresh"
        response.delete_cookie(key=f"refresh_token_{r}", **refresh_params)

    # Xóa legacy cookies
    if IS_PRODUCTION:
        legacy_domains = [".fastbuy.io.vn", "fastbuy.io.vn"]
        for d in legacy_domains:
            for name in ["access_token", "refresh_token", "access_token_buyer",
                         "access_token_seller", "access_token_admin"]:
                response.delete_cookie(key=name, **get_params(d))