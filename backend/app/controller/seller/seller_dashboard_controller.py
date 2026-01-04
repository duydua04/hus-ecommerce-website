from fastapi import APIRouter, Depends, Query
from typing import List

from ...middleware.auth import require_seller

from ...services.seller.seller_dashboard_service import get_seller_dashboard_service, SellerDashboardService
from ...tasks.seller_dashboard_task import task_seller_recalc_dashboard

from ...schemas.seller_dashboard import (
    DashboardStatsResponse,
    TopProductResponse,
    ChartResponse
)

router = APIRouter(
    prefix="/seller/dashboard",
    tags=["seller-dashboard"]
)


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
        service: SellerDashboardService = Depends(get_seller_dashboard_service),
        current_seller=Depends(require_seller)
):
    """
    Trả về 4 chỉ số: Doanh thu, Tổng đơn, Đơn chờ, Đơn hủy
    """
    stats = await service.get_stats(current_seller["user"].seller_id)
    return stats


@router.get("/chart", response_model=ChartResponse)
async def get_revenue_chart(
        view: str = Query(
            "monthly", regex="^(monthly|daily)$",
              description="Chọn 'monthly' (12 tháng) hoặc 'daily' (ngày trong tháng)"
        ),
        service: SellerDashboardService = Depends(get_seller_dashboard_service),
        current_seller=Depends(require_seller)
):
    """
    Trả về dữ liệu vẽ biểu đồ.
    - monthly: Trả về mảng 12 phần tử (Tháng 1 -> 12) của năm nay.
    - daily: Trả về mảng số ngày trong tháng hiện tại (28-31 phần tử).
    """
    data = await service.get_chart(current_seller["user"].seller_id, view)

    label = "Doanh thu năm nay" if view == "monthly" else "Doanh thu tháng này"

    return {
        "data": data,
        "label": label
    }


@router.get("/top-products", response_model=List[TopProductResponse])
async def get_top_selling_products(
        service: SellerDashboardService = Depends(get_seller_dashboard_service),
        current_seller=Depends(require_seller)
):
    """
    Trả về Top 5 sản phẩm bán chạy nhất
    - Sắp xếp theo số lượng đã bán (sold).
    - Có kèm ảnh (lấy ảnh primary) và doanh thu của sản phẩm đó.
    """
    products = await service.get_top_products(current_seller["user"].seller_id)
    return products


# 4. API FORCE SYNC (ĐỒNG BỘ THỦ CÔNG)
@router.post("/sync")
async def force_sync_dashboard(
        current_seller=Depends(require_seller)
):
    """
    API này dùng để Seller tự bấm nút 'Làm mới dữ liệu' nếu thấy nghi ngờ số liệu cũ.
    """
    task_seller_recalc_dashboard.delay(current_seller["user"].seller_id)

    return {"message": "Đang đồng bộ dữ liệu, vui lòng đợi trong giây lát..."}