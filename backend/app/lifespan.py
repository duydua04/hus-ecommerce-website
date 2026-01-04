import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from .config.mongo import init_mongo
from .config.db import AsyncSessionLocal

from .utils.socket_manager import socket_manager
from .services.admin.admin_dashboard_service import admin_dashboard_service


logger = logging.getLogger("uvicorn.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Quản lý vòng đời Main Server:
    """

    logger.info(">>> [LIFESPAN] STARTING APP...")

    try:
        await init_mongo()
        logger.info(">>> [LIFESPAN] MongoDB Connected!")
    except Exception as e:
        logger.critical(f">>> [LIFESPAN] Mongo Failed: {e}")
        raise e

    try:
        await socket_manager.connect_redis()
        logger.info(">>> [LIFESPAN] Redis Connected (for Socket).")
    except Exception as e:
        logger.error(f">>> [LIFESPAN] Redis Failed: {e}")

    try:
        # Kiểm tra xem Redis đã có dữ liệu chưa
        is_synced = await admin_dashboard_service.redis.exists(
            admin_dashboard_service.KEY_TOTAL_REVENUE
        )

        if not is_synced:
            logger.info(">>> [LIFESPAN] Redis Admin Stats is Empty. Starting FULL SYNC...")

            async with AsyncSessionLocal() as db:
                await admin_dashboard_service.sync_all_stats(db)

            logger.info(">>> [LIFESPAN] Admin Stats Synced Successfully!")
        else:
            logger.info(">>> [LIFESPAN] Redis Admin Stats already exists. Skipping Sync.")

    except Exception as e:
        logger.warning(f">>> [LIFESPAN] Admin Sync Failed (App will continue): {e}")

    listener_task = asyncio.create_task(socket_manager.run_redis_listener())
    logger.info(">>> [LIFESPAN] Redis Listener Started.")

    yield
    logger.info(">>> [LIFESPAN] SHUTTING DOWN...")

    if listener_task:
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            logger.info(">>> [LIFESPAN] Listener Task Stopped.")

    await socket_manager.close_redis()
    logger.info(">>> [LIFESPAN] Redis Connection Closed.")

    logger.info(">>> [LIFESPAN] Bye Bye!")