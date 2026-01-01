import asyncio
import logging
import redis.asyncio as redis

from ..utils.celery_client import celery_app
from ..config.db import AsyncSessionLocal
from ..config.settings import settings
from ..services.seller.seller_dashboard_service import SellerDashboardService
from ..utils.socket_manager import socket_manager

logger = logging.getLogger(__name__)


def run_async(coro):
    return asyncio.run(coro)


@celery_app.task(name="task_seller_recalc_dashboard")
def task_seller_recalc_dashboard(seller_id: int):
    async def _process():
        if not seller_id:
            return

        redis_client = None
        try:
            async with AsyncSessionLocal() as db:

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
                    logger.info("[SELLER TASK] Socket Manager connected to Redis")
                service = SellerDashboardService(db, redis_client)
                await service.sync_realtime_data(seller_id)

                logger.info(f"[SELLER TASK] Dashboard synced for Seller ID: {seller_id}")

        except Exception as e:
            logger.error(f"[SELLER TASK] Error syncing dashboard for Seller {seller_id}: {e}")

        finally:
            if redis_client:
                await redis_client.close()

    run_async(_process())