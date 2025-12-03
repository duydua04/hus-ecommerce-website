# app/lifespan.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .mongo import init_mongo


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Hàm quản lý vòng đời ứng dụng:
    - Chạy trước khi app nhận request (Startup)
    - Chạy sau khi app tắt (Shutdown)
    """

    print("[STARTUP] Connecting to MongoDB...")
    try:
        await init_mongo()
        print("[STARTUP] MongoDB Connected & Beanie Initialized!")
    except Exception as e:
        print(f"[STARTUP] MongoDB Connection Failed: {e}")
        raise e

    yield

    # --- SHUTDOWN ---
    print("[SHUTDOWN] Application is stopping...")