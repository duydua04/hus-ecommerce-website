import asyncio
import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import redis.asyncio as redis
from sqlalchemy import select

from ..config.settings import settings
from ..models.notification import Notification
from ..models.users import Admin
from ..config.db import AsyncSessionLocal
from ..utils.celery_client import celery_app
from ..utils.socket_manager import socket_manager

logger = logging.getLogger(__name__)


async def init_worker_mongo():
    """Khởi tạo MongoDB (Beanie cần chạy trong loop hiện tại)"""
    client = AsyncIOMotorClient(settings.MONGO_URL)
    await init_beanie(
        database=client[settings.MONGO_DB_NAME],
        document_models=[Notification]
    )


@celery_app.task(name="task_send_notification")
def task_send_notification(
        user_id: int, role: str,
        title: str, message: str,
        event_type: str, data: dict
):
    async def _process():
        # 1. TẠO KẾT NỐI REDIS MỚI (QUAN TRỌNG)
        local_redis = redis.from_url(
            settings.redis_url_broker,
            encoding="utf-8",
            decode_responses=True
        )

        try:
            await init_worker_mongo()

            # Lưu Notification vào Mongo
            notif = Notification(
                recipient_id=user_id,
                recipient_role=role,
                title=title,
                message=message,
                event_type=event_type,
                data=data or {},
                created_at=datetime.now(timezone.utc),
                is_read=False
            )
            await notif.insert()

            # Chuẩn bị payload socket
            ws_payload = {
                "type": "NOTIFICATION",
                "id": str(notif.id),
                "title": title,
                "message": message,
                "data": data
            }

            await socket_manager.send_to_user(
                ws_payload,
                user_id,
                role,
                external_redis=local_redis  # <--- Fix lỗi tại đây
            )

            logger.info(f"[Celery] Sent notification to User {user_id}")

        except Exception as e:
            logger.error(f"[Celery Error] Notification Failed: {e}")
        finally:
            # 3. ĐÓNG KẾT NỐI
            await local_redis.close()

    asyncio.run(_process())


@celery_app.task(name="task_broadcast_admin_notification")
def task_broadcast_admin_notification(title: str, message: str, event_type: str, data: dict):
    async def _process():
        # 1. TẠO KẾT NỐI REDIS MỚI
        local_redis = redis.from_url(
            settings.redis_url_broker,
            encoding="utf-8",
            decode_responses=True
        )

        try:
            await init_worker_mongo()

            # Lưu vào DB SQL (nếu cần)
            async with AsyncSessionLocal() as db:
                admins = (await db.execute(select(Admin))).scalars().all()
                docs = [
                    Notification(
                        recipient_id=a.admin_id,
                        recipient_role="admin",
                        title=title,
                        message=message,
                        event_type=event_type,
                        data=data or {},
                        created_at=datetime.now(timezone.utc),
                        is_read=False
                    ) for a in admins if a.admin_id
                ]
                if docs:
                    await Notification.insert_many(docs)

            # 2. TRUYỀN local_redis VÀO BROADCAST
            ws_payload = {
                "type": "NOTIFICATION",
                "title": title,
                "message": message,
                "data": data
            }
            await socket_manager.broadcast_admin(
                ws_payload,
                external_redis=local_redis  # <--- Fix lỗi tại đây
            )

        except Exception as e:
            logger.error(f"[Celery Error] Broadcast Failed: {e}")
        finally:
            # 3. ĐÓNG KẾT NỐI
            await local_redis.close()

    asyncio.run(_process())