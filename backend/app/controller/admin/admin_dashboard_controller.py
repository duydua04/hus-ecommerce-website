from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from ...config.db import get_db
from ...middleware.auth import require_admin
from ...services.admin.admin_dashboard_service import admin_dashboard_service

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])

@router.post("/sync-data")
async def sync_data(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    """Reset và tính toán lại toàn bộ dữ liệu Redis"""
    return await admin_dashboard_service.sync_total_stats(db)

@router.get("/summary")
async def summary(_=Depends(require_admin)):
    """Lấy 4 chỉ số tổng (Revenue, Orders, Buyers, Sellers)"""
    return await admin_dashboard_service.get_summary_stats()

@router.get("/top-buyers")
async def top_buyers(
    period: str = "month",
    criteria: str = Query("orders", regex="^(orders|revenue)$"),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin)
):
    """Top Buyers theo số đơn hoặc số tiền"""
    return await admin_dashboard_service.get_top_users(db, 'buyer', period, criteria)

@router.get("/top-sellers")
async def top_sellers(
    period: str = "month",
    criteria: str = Query("orders", regex="^(orders|revenue)$"),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin)
):
    """[MỚI] Top Sellers theo số đơn hoặc doanh thu"""
    return await admin_dashboard_service.get_top_users(db, 'seller', period, criteria)

@router.get("/carriers")
async def carriers(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    """Thống kê nhà vận chuyển"""
    return await admin_dashboard_service.get_carrier_stats(db)