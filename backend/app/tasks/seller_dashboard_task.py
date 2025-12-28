import asyncio
import logging
from ..utils.celery_client import celery_app
from ..config.db import AsyncSessionLocal
from ..config.redis import get_redis_client

from ..services.seller.seller_dashboard_service import SellerDashboardService

# Setup Logger
logger = logging.getLogger(__name__)


def run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(name="task_seller_recalc_dashboard")
def task_seller_recalc_dashboard(seller_id: int):
    async def _process():
        # Kiểm tra seller_id hợp lệ
        if not seller_id:
            return

        try:
            # Khởi tạo Session DB và Redis Client mới cho Worker này
            async with AsyncSessionLocal as db:
                redis = await get_redis_client()
                service = SellerDashboardService(db, redis)
                await service.sync_realtime_data(seller_id)
                logger.info(f"[SELLER TASK] Dashboard synced for Seller ID: {seller_id}")

        except Exception as e:
            logger.error(f"[SELLER TASK] Error syncing dashboard for Seller {seller_id}: {e}")

    run_async(_process())