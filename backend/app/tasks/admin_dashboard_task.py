import asyncio
import logging
from ..utils.celery_client import celery_app
from ..utils.socket_manager import socket_manager
from ..services.admin.admin_dashboard_service import admin_dashboard_service

# Setup Logger
logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper để chạy async function trong Celery"""
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(name="task_admin_add_order_stats")
def task_admin_add_order_stats(order_data: dict):
    async def _process():
        try:
            await admin_dashboard_service.handle_new_order_stats(order_data)
            await socket_manager.broadcast_admin("DATA_UPDATED")

            logger.info(f"[ADMIN TASK] Added stats for Order #{order_data.get('order_id')}")
        except Exception as e:
            logger.error(f"[ADMIN TASK] Error adding stats: {e}")

    run_async(_process())


@celery_app.task(name="task_admin_revert_order_stats")
def task_admin_revert_order_stats(order_data: dict):
    async def _process():
        try:
            await admin_dashboard_service.handle_revert_order_stats(order_data)
            await socket_manager.broadcast_admin("DATA_UPDATED")

            logger.info(f"[ADMIN TASK] Reverted stats for Order #{order_data.get('order_id')}")
        except Exception as e:
            logger.error(f"[ADMIN TASK] Error reverting stats: {e}")

    run_async(_process())


@celery_app.task(name="task_admin_update_user_count")
def task_admin_update_user_count(role: str, action: str):
    async def _process():
        try:
            await admin_dashboard_service.handle_user_count(role, action)
            await socket_manager.broadcast_admin("DATA_UPDATED")
        except Exception as e:
            logger.error(f"[ADMIN TASK] Error updating user count: {e}")

    run_async(_process())