import asyncio
import logging
import redis.asyncio as redis

from ..utils.celery_client import celery_app
from ..utils.socket_manager import socket_manager
from ..config.db import AsyncSessionLocal
from ..config.settings import settings
from ..services.admin.admin_dashboard_service import AdminDashboardService

logger = logging.getLogger(__name__)


async def run_task_with_resources(task_logic, *args, **kwargs):
    """Wrapper để khởi tạo và dọn dẹp DB + Redis"""
    db = AsyncSessionLocal()

    # 1. Tạo Redis riêng
    redis_client = redis.from_url(
        settings.redis_url_cache,
        encoding="utf-8",
        decode_responses=True
    )

    try:
        # Truyền redis_client vào logic chính
        await task_logic(db, redis_client, *args, **kwargs)
    except Exception as e:
        logger.error(f"[ADMIN TASK ERROR] {e}")
    finally:
        await db.close()
        await redis_client.close()  # 3. Đóng Redis


# --- CÁC TASK ---

@celery_app.task(name="task_admin_add_order_stats")
def task_admin_add_order_stats(order_data: dict):
    async def _logic(db, redis_client):
        service = AdminDashboardService(db, redis_client)
        await service.handle_new_order_stats(order_data)

        # 2. Truyền redis_client vào external_redis
        msg = {
            "type": "DATA_UPDATED",
            "action": "NEW_ORDER",
            "data": order_data
        }
        await socket_manager.broadcast_admin(msg, external_redis=redis_client)

        logger.info(f"[ADMIN TASK] Added stats for Order #{order_data.get('order_id')}")

    asyncio.run(run_task_with_resources(_logic))


@celery_app.task(name="task_admin_revert_order_stats")
def task_admin_revert_order_stats(order_data: dict):
    async def _logic(db, redis_client):
        service = AdminDashboardService(db, redis_client)
        await service.handle_revert_order_stats(order_data)

        await socket_manager.broadcast_admin(
            {"type": "DATA_UPDATED", "action": "REVERT_ORDER"},
            external_redis=redis_client
        )
        logger.info(f"[ADMIN TASK] Reverted stats for Order #{order_data.get('order_id')}")

    asyncio.run(run_task_with_resources(_logic))


@celery_app.task(name="task_admin_update_user_count")
def task_admin_update_user_count(role: str, action: str):
    async def _logic(db, redis_client):
        service = AdminDashboardService(db, redis_client)
        await service.handle_user_count(role, action)

        await socket_manager.broadcast_admin(
            {"type": "DATA_UPDATED", "action": "USER_COUNT_CHANGE"},
            external_redis=redis_client
        )

    asyncio.run(run_task_with_resources(_logic))