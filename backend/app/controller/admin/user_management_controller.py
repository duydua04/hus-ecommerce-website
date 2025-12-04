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
def admin_list_buyers(
    q: str | None = Query(None, description="Search buyer"),
    active_only: bool = Query(True),
    limit: int = Query(10, ge=1, le=200),
    offset: int = Query(0, ge=0),
    service: AdminUserManagementService = Depends(get_admin_user_management_service) # Inject Service
):
    """Lấy danh sách Buyer"""
    # Gọi method của class
    return service.list_buyers(
        search_query=q,
        active_only=active_only,
        limit=limit,
        offset=offset
    )


@router.get("/sellers", response_model=Page, dependencies=[Depends(require_admin)])
def admin_list_sellers(
    q: str | None = Query(None, description="Search sellers"),
    active_only: bool = Query(True),
    limit: int = Query(10, ge=1, le=200),
    offset: int = Query(0, ge=0),
    service: AdminUserManagementService = Depends(get_admin_user_management_service)
):
    """Lấy danh sách Seller"""
    # Gọi method của class
    return service.list_sellers(
        search_query=q,
        active_only=active_only,
        limit=limit,
        offset=offset
    )


@router.delete("/sellers/{seller_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_admin)])
def admin_delete_seller(
    seller_id: int = Path(..., ge=1),
    service: AdminUserManagementService = Depends(get_admin_user_management_service)
):
    """API vô hiệu hóa tài khoản Seller (Soft Delete)"""
    # Gọi method của class
    return service.soft_delete_seller(seller_id)


@router.delete("/buyers/{buyer_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_admin)])
def admin_delete_buyer(
    buyer_id: int = Path(..., ge=1),
    service: AdminUserManagementService = Depends(get_admin_user_management_service)
):
    """API vô hiệu hóa tài khoản Buyer (Soft Delete)"""
    return service.soft_delete_buyer(buyer_id)