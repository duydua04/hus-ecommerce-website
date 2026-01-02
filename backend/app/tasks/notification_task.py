import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import redis.asyncio as redis
from ..config.settings import settings
from ..models.notification import Notification
from ..models.users import Admin
from ..config.db import AsyncSessionLocal
from ..utils.celery_client import celery_app
from ..utils.socket_manager import socket_manager

logger = logging.getLogger(__name__)

async def init_worker_mongo():
    client = AsyncIOMotorClient(settings.MONGO_URL)

    await init_beanie(
        database=client[settings.MONGO_DB_NAME],
        document_models=[Notification]
    )

async def init_socket_redis():
    """Chỉ khởi tạo Redis cho Socket vì task này không cần DB SQL hay Cache"""
    if socket_manager.redis_pub is None or socket_manager.redis is None:
        try:
            redis_conn = redis.from_url(
                settings.redis_url_broker,
                encoding="utf-8",
                decode_responses=True
            )

            # 👇 GÁN CHO CẢ 2 BIẾN (Đây là chỗ bạn đang thiếu)
            socket_manager.redis = redis_conn
            socket_manager.redis_pub = redis_conn

            logger.info("[NOTIFICATION TASK] Socket Redis (Pub & Sub) connected successfully")
        except Exception as e:
            logger.error(f"[NOTIFICATION TASK] Failed to connect Redis: {e}")


@celery_app.task(name="task_send_notification")
def task_send_notification(
        user_id: int, role: str,
        title: str, message: str,
        event_type: str, data: dict
):
    """Unicast: Gửi thông báo cho 1 người"""

    async def _process():
        try:
            await init_socket_redis()
            await init_worker_mongo()

            # Tạo object Notification
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

            # Lưu vào MongoDB
            await notif.insert()
            print(f"[Celery] Saved Notification ID: {notif.id} for User {user_id}")

            # Gửi Socket Realtime
            ws_payload = {
                "type": "NOTIFICATION",
                "id": str(notif.id),
                "title": title,
                "message": message,
                "data": data
            }
            await socket_manager.send_to_user(ws_payload, user_id, role)

        except Exception as e:
            print(f"[Celery Error] Send Notification Failed: {e}")

    asyncio.run(_process())


@celery_app.task(name="task_broadcast_admin_notification")
def task_broadcast_admin_notification(title: str, message: str,
                                      event_type: str, data: dict
                                      ):
    """Broadcast: Gửi thông báo cho toàn bộ Admin"""

    async def _process():
        try:
            await init_worker_mongo()

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
                    print(f"[Celery] Broadcast saved {len(docs)} notifications to Admin")

                for n in docs:
                    ws_payload = {
                        "type": "NOTIFICATION",
                        "id": str(n.id),
                        "title": title,
                        "message": message,
                        "data": data
                    }
                    await socket_manager.send_to_user(ws_payload, n.recipient_id, "admin")

        except Exception as e:
            print(f"[Celery Error] Broadcast Failed: {e}")

    asyncio.run(_process())