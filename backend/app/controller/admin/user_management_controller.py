from fastapi import APIRouter, Depends, Query, status, Path
from ...middleware.auth import require_admin
from ...schemas.common import Page

from ...services.admin.user_management_service import (
    AdminUserManagementService,
    get_admin_user_management_service
)

router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"]
)


@router.get("/buyers", response_model=Page, dependencies=[Depends(require_admin)])
async def admin_list_buyers(
    q: str | None = Query(None, description="Search buyer"),
    active_only: bool = Query(True),
    limit: int = Query(10, ge=1, le=200),
    offset: int = Query(0, ge=0),
    service: AdminUserManagementService = Depends(get_admin_user_management_service)
):
    """
    **Lấy danh sách Người mua (Buyer) trong hệ thống.**

    Hỗ trợ tìm kiếm theo tên/email và lọc theo trạng thái hoạt động.

    ### Tham số:
    - **q**: Từ khóa tìm kiếm 
    - **active_only**: 
        - `true`: Chỉ lấy tài khoản đang hoạt động (Mặc định).
        - `false`: Lấy tất cả bao gồm cả tài khoản đã bị vô hiệu hóa.
    - **limit/offset**: Phân trang dữ liệu (Tối đa 200 bản ghi/trang).

    ### Quyền truy cập:
    - Yêu cầu quyền **Administrator**.
    """
    return await service.list_buyers(
        search_query=q,
        active_only=active_only,
        limit=limit,
        offset=offset
    )


@router.get("/sellers", response_model=Page, dependencies=[Depends(require_admin)])
async def admin_list_sellers(
    q: str | None = Query(None, description="Search sellers"),
    active_only: bool = Query(True),
    limit: int = Query(10, ge=1, le=200),
    offset: int = Query(0, ge=0),
    service: AdminUserManagementService = Depends(get_admin_user_management_service)
):
    """
    **Lấy danh sách các Nhà bán hàng (Seller).**

    Admin sử dụng API này để kiểm soát danh sách gian hàng trên hệ thống.

    ### Tham số:
    - **q**: Tìm kiếm theo từ khóa
    - **active_only**: Lọc theo trạng thái hoạt động của gian hàng.

    ### Kết quả trả về:
    - Trả về đối tượng phân trang chứa thông tin chi tiết về Shop và trạng thái xác thực.
    """
    return await service.list_sellers(
        search_query=q,
        active_only=active_only,
        limit=limit,
        offset=offset
    )


@router.delete("/sellers/{seller_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_admin)])
async def admin_delete_seller(
    seller_id: int = Path(..., ge=1),
    service: AdminUserManagementService = Depends(get_admin_user_management_service)
):
    """API vô hiệu hóa tài khoản Seller"""
    return await service.soft_delete_seller(seller_id)


@router.delete("/buyers/{buyer_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_admin)])
async def admin_delete_buyer(
    buyer_id: int = Path(..., ge=1),
    service: AdminUserManagementService = Depends(get_admin_user_management_service)
):
    """API vô hiệu hóa tài khoản Buyer (Soft Delete)"""
    return await service.soft_delete_buyer(buyer_id)