import pyotp
from ..config.settings import settings

def create_otp():
    return pyotp.TOTP(pyotp.random_base32(), interval=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES * 60).now()