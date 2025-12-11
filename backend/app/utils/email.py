from fastapi_mail import FastMail, MessageSchema, MessageType
from ..config.email import conf
import logging

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.fm = FastMail(conf)

    async def send_otp_email(self, email_to: str, name: str, otp: str):
        """
        Gửi email chứa mã OTP
        """
        try:
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

            await self.fm.send_message(message, template_name="otp_email.html")
            logger.info(f"Email OTP sent successfully to {email_to}")

        except Exception as e:
            logger.error(f"Fail to sent OTP email to {email_to}: {e}")


email_service = EmailService()