from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from ...config.db import get_db
from ...middleware.auth import require_admin
from ...services.admin.admin_dashboard_service import admin_dashboard_service

router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Dashboard"],
    dependencies=[Depends(require_admin)]
)

@router.post("/sync-data")
async def sync_data(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    API QUAN TRỌNG: Chạy cái này 1 lần để tính toán lại toàn bộ dữ liệu từ DB nạp vào Redis.
    """
    background_tasks.add_task(admin_dashboard_service.sync_all_stats, db)
    return {"message": "Sync process started in background"}


@router.get("/summary")
async def summary():
    """4 chỉ số tổng quan (All-time)"""
    return await admin_dashboard_service.get_summary_stats()


@router.get("/top-buyers")
async def top_buyers(
    criteria: str = Query("orders", regex="^(orders|revenue)$"),
    db: AsyncSession = Depends(get_db),
):
    """Top Buyers tích lũy"""
    return await admin_dashboard_service.get_top_users(db, 'buyer', criteria)


@router.get("/top-sellers")
async def top_sellers(
    criteria: str = Query("orders", regex="^(orders|revenue)$"),
    db: AsyncSession = Depends(get_db)
):
    """Top Sellers tích lũy"""
    return await admin_dashboard_service.get_top_users(db, 'seller', criteria)

@router.get("/top-categories")
async def top_categories(
    criteria: str = Query("sold", regex="^(sold|revenue)$"),
    db: AsyncSession = Depends(get_db)
):
    """Top Danh mục tích lũy (theo số lượng bán hoặc doanh thu)"""
    return await admin_dashboard_service.get_top_categories(db, criteria)


@router.get("/carriers")
async def carriers(db: AsyncSession = Depends(get_db)):
    """Thống kê vận chuyển tích lũy"""
    return await admin_dashboard_service.get_carrier_stats(db)