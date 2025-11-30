from fastapi_mail import FastMail, MessageSchema, MessageType
from ..config.email import conf


async def send_otp_email(email_to: str, name: str, otp: str):
    """Gửi email chứa mã OTP"""

    message = MessageSchema(
        subject="[HUS-Ecommerce] Mã xác thực đặt lại mật khẩu",
        recipients=[email_to],
        template_body={
            "name": name,
            "otp": otp,
            "app_name": "HUS Ecommerce"
        },
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message, template_name="otp_email.html")