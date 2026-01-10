from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from ...config.db import get_db
from ...services.admin.admin_dashboard_service import admin_dashboard_service

router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Dashboard"]
)

@router.post("/sync-data")
async def sync_data(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    API QUAN TRỌNG: Chạy 1 lần để đồng bộ dữ liệu DB -> Redis
    **Đồng bộ hóa dữ liệu toàn hệ thống từ Database sang Redis.**

    API này dùng để làm mới dữ liệu thống kê. Do quá trình tính toán phức tạp, tác vụ sẽ được chạy dưới nền (Background Task).

    ### Chú ý:
    - Chỉ nên chạy khi hệ thống vừa khởi động hoặc khi có sai lệch dữ liệu thống kê.
    - Kết quả trả về ngay lập tức với thông báo `Sync started`, tiến trình thật sự sẽ chạy ngầm.

    ### Trạng thái:
    - **200 OK**: Bắt đầu tiến trình thành công.
    """
    background_tasks.add_task(admin_dashboard_service.sync_all_stats, db)
    return {"message": "Sync started"}


@router.get("/summary")
async def summary():
    """
    **Lấy các con số thống kê tổng quan của hệ thống.**

    Trả về các chỉ số tích lũy giúp Admin có cái nhìn nhanh về quy mô kinh doanh.

    ### Dữ liệu bao gồm:
    - Tổng doanh thu thực tế.
    - Tổng số đơn hàng đã hoàn thành.
    - Số lượng người dùng (Buyers & Sellers).

    ### Nguồn dữ liệu:
    - Dữ liệu được truy vấn trực tiếp từ **Redis**
    """
    return await admin_dashboard_service.get_summary_stats()


@router.get("/top-buyers")
async def top_buyers(
    criteria: str = Query("orders", regex="^(orders|revenue)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    **Danh sách Top 10 khách hàng tiềm năng nhất.**

    ### Tham số lọc (`criteria`):
    - `orders`: Sắp xếp theo **Số lượng đơn hàng** đã mua (Mặc định).
    - `revenue`: Sắp xếp theo **Tổng số tiền** đã chi trả.

    ### Quyền truy cập:
    - Chỉ dành cho **Administrator**.
    """
    return await admin_dashboard_service.get_top_users(db, 'buyer', criteria)


@router.get("/top-sellers")
async def top_sellers(
    criteria: str = Query("orders", regex="^(orders|revenue)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    **Danh sách Top 10 Nhà bán hàng (Sellers) xuất sắc nhất.**

    Giúp Admin xác định những nhà bán hàng có hoạt động tích cực và đóng góp doanh thu lớn nhất cho hệ thống.

    ### Tham số lọc (`criteria`):
    - `orders`: Sắp xếp theo **Số lượng đơn hàng** đã bán được (Mặc định).
    - `revenue`: Sắp xếp theo **Tổng doanh thu** mà nhà bán hàng mang lại.

    ### Quyền truy cập:
    - Yêu cầu quyền **Administrator**.
    """
    return await admin_dashboard_service.get_top_users(db, 'seller', criteria)


@router.get("/top-categories")
async def top_categories(
    criteria: str = Query("sold", regex="^(sold|revenue)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    **Thống kê hiệu suất kinh doanh theo Danh mục sản phẩm.**

    Giúp Admin biết được ngành hàng nào đang hoạt động tốt nhất.

    ### Tiêu chí sắp xếp:
    - `sold`: Theo **Số lượng sản phẩm** đã bán ra.
    - `revenue`: Theo **Doanh thu** mang về từ danh mục đó.
    """
    
    return await admin_dashboard_service.get_top_categories(db, criteria)


@router.get("/carriers")
async def carriers(db: AsyncSession = Depends(get_db)):
    """
    **Phân tích tỷ lệ sử dụng của các đơn vị vận chuyển.**

    ### Kết quả trả về:
    - Tên đơn vị vận chuyển (GHTK, GHN, ShopeeExpress, v.v.)
    - Số lượng đơn hàng phụ trách.
    - Tỷ lệ phần trăm trên tổng số đơn toàn hệ thống.
    """
    return await admin_dashboard_service.get_carrier_stats(db)