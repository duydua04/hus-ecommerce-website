import os
from celery import Celery
from celery.schedules import crontab
from celery.utils.time import timezone

# Celery sẽ đọc biến môi trường từ .env qua docker-compose
broker_url  = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
backend_url = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1")

celery_app = Celery(
    "tiers",
    broker=broker_url,
    backend=backend_url,
)

celery_app.conf.timezone = "Asia/Bangkok"

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # import task để Celery nhận diện
    from .tasks.tier_tasks import recompute_all_tiers
    # 02:00 UTC mỗi ngày — đổi theo nhu cầu (hoặc dùng Asia/Bangkok thời gian máy)
    sender.add_periodic_task(
        crontab(hour=2, minute=0, timezone="Asia/Bangkok"),
        recompute_all_tiers.s(),
        name="recompute tiers daily"
    )


