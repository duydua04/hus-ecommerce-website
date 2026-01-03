import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from .config.mongo import init_mongo
from .utils.socket_manager import socket_manager

logger = logging.getLogger("uvicorn.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Quản lý vòng đời Main Server:
    - Startup: Kết nối Mongo, Redis và Bật chế độ 'Hóng chuyện' (Listener).
    - Shutdown: Tắt Listener, Đóng kết nối.
    """

    logger.info(">>> [LIFESPAN] STARTING APP...")

    try:
        await init_mongo()
        logger.info(">>> [LIFESPAN] MongoDB Connected!")
    except Exception as e:
        logger.critical(f">>> [LIFESPAN] Mongo Failed: {e}")
        raise e

    # B. Kết nối Redis (Giữ kết nối này SỐNG mãi để nghe tin)
    try:
        await socket_manager.connect_redis()
        logger.info(">>> [LIFESPAN] Redis Connected for Socket.")
    except Exception as e:
        logger.error(f">>> [LIFESPAN] Redis Failed: {e}")


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

    # B. Đóng kết nối Redis
    await socket_manager.close_redis()
    logger.info(">>> [LIFESPAN] Redis Connection Closed.")

    logger.info(">>> [LIFESPAN] Bye Bye!")