from fastapi_mail import FastMail, MessageSchema, MessageType
from ..config.email import conf

class EmailService:
    def __init__(self):
        self.fm = FastMail(conf)

    async def send_otp_email(self, email_to: str, name: str, otp: str):
        """
        Gửi email chứa mã OTP
        """
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

        # Sử dụng instance self.fm đã khởi tạo
        await self.fm.send_message(message, template_name="otp_email.html")

# Tạo một instance duy nhất (Singleton) để import và sử dụng ở nơi khác
email_service = EmailService()