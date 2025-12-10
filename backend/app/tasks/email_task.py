import asyncio
from ..utils.celery_client import celery_app
from ..utils.email import email_service


@celery_app.task(name="send_otp_email_task",
                 autoretry_for=(Exception,),
                 retry_backoff=True,
                 max_retries=3
)
def send_otp_email_task(email_to: str, name: str, otp: str):
    asyncio.run(email_service.send_otp_email(email_to, name, otp))