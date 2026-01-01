import asyncio
import logging
import redis.asyncio as redis

from ..utils.celery_client import celery_app
from ..utils.socket_manager import socket_manager
from ..config.db import AsyncSessionLocal
from ..config.settings import settings
from ..services.admin.admin_dashboard_service import AdminDashboardService

logger = logging.getLogger(__name__)


async def init_resources():
    """Tạo kết nối DB và Redis mới cho Worker"""
    db = AsyncSessionLocal()

    # 2. Redis Client
    redis_client = redis.from_url(
        settings.redis_url_cache,
        encoding="utf-8",
        decode_responses=True
    )

    if socket_manager.redis is None:
        socket_manager.redis = redis.from_url(
            settings.redis_url_broker,
            encoding="utf-8",
            decode_responses=True
        )

    return db, redis_client


@celery_app.task(name="task_admin_add_order_stats")
def task_admin_add_order_stats(order_data: dict):
    async def _process():
        db = None
        redis_client = None
        try:
            # 1. Khởi tạo tài nguyên
            db, redis_client = await init_resources()
            service = AdminDashboardService(db, redis_client)

            await service.handle_new_order_stats(order_data)
            await socket_manager.broadcast_admin("DATA_UPDATED")

            logger.info(f"[ADMIN TASK] Added stats for Order #{order_data.get('order_id')}")

        except Exception as e:
            logger.error(f"[ADMIN TASK] Error adding stats: {e}")
        finally:
            # 5. Dọn dẹp
            if db: await db.close()
            if redis_client: await redis_client.close()

    asyncio.run(_process())


@celery_app.task(name="task_admin_revert_order_stats")
def task_admin_revert_order_stats(order_data: dict):
    async def _process():
        db = None
        redis_client = None
        try:
            db, redis_client = await init_resources()
            service = AdminDashboardService(db, redis_client)  # Init mới

            await service.handle_revert_order_stats(order_data)
            await socket_manager.broadcast_admin("DATA_UPDATED")

            logger.info(f"[ADMIN TASK] Reverted stats for Order #{order_data.get('order_id')}")
        except Exception as e:
            logger.error(f"[ADMIN TASK] Error reverting stats: {e}")
        finally:
            if db: await db.close()
            if redis_client: await redis_client.close()

    asyncio.run(_process())


@celery_app.task(name="task_admin_update_user_count")
def task_admin_update_user_count(role: str, action: str):
    async def _process():
        db = None
        redis_client = None
        try:
            db, redis_client = await init_resources()
            service = AdminDashboardService(db, redis_client)

            await service.handle_user_count(role, action)
            await socket_manager.broadcast_admin("DATA_UPDATED")
        except Exception as e:
            logger.error(f"[ADMIN TASK] Error updating user count: {e}")
        finally:
            if db: await db.close()
            if redis_client: await redis_client.close()

    asyncio.run(_process())