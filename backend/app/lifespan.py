from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncio
from .config.mongo import init_mongo
from .utils.socket_manager import socket_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Hàm quản lý vòng đời ứng dụng (Startup và Shutdown):
    1. Khởi tạo MongoDB (Beanie).
    2. Khởi tạo và chạy Redis Listener cho WebSocket.
    """

    print("[STARTUP] Starting Application...")

    print("[STARTUP] Connecting to MongoDB...")
    try:
        await init_mongo()
        print("[STARTUP] MongoDB Connected & Beanie Initialized!")
    except Exception as e:
        print(f"[STARTUP] MongoDB Connection Failed: {e}")
        raise e

    print("[STARTUP] Starting Redis Pub/Sub Listener...")

    await socket_manager.connect_redis()

    listener_task = asyncio.create_task(socket_manager.run_redis_listener())

    yield

    print("[SHUTDOWN] Application is stopping...")

    listener_task.cancel()
    try:
        # Đợi task kết thúc
        await listener_task
    except asyncio.CancelledError:
        pass

    await socket_manager.close_redis()
    print("[SHUTDOWN] Redis Chat Closed.")

    print("[SHUTDOWN] Application successfully stopped.")