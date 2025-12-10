from fastapi import APIRouter, Depends, Query, status, Body
from ...middleware.auth import require_admin
from ...schemas.discount import DiscountCreate, DiscountResponse, DiscountUpdate

from ...services.admin.admin_discount_management_service import AdminDiscountService, get_discount_service

router = APIRouter(
    prefix="/admin/discounts",
    tags=["admin-discounts"],
    dependencies=[Depends(require_admin)]
)


@router.get("/")
async def admin_list_discount(
    q: str | None = None,
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    service: AdminDiscountService = Depends(get_discount_service)
):
    """Lấy danh sách mã giảm giá"""
    return await service.list(q=q, limit=limit, offset=offset)


@router.post("/", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_discount(
    payload: DiscountCreate,
    service: AdminDiscountService = Depends(get_discount_service)
):
    """Tạo mã giảm giá mới"""
    return await service.create(payload)


@router.patch("/{discount_id}", response_model=DiscountResponse)
async def admin_update_discount(
    discount_id: int,
    payload: DiscountUpdate,
    service: AdminDiscountService = Depends(get_discount_service)
):
    """Cập nhật thông tin mã giảm giá"""
    return await service.update(discount_id, payload)


@router.patch("/{discount_id}/status", response_model=DiscountResponse)
async def admin_set_status(
    discount_id: int,
    is_active: bool = Body(..., embed=True), # Body: { "is_active": true }
    service: AdminDiscountService = Depends(get_discount_service)
):
    """
    Bật/Tắt trạng thái kích hoạt của mã.
    """
    return await service.set_status(discount_id, is_active)


@router.delete("/{discount_id}")
async def admin_delete_discount(
    discount_id: int,
    service: AdminDiscountService = Depends(get_discount_service)
):
    """Xóa mã giảm giá (Nếu chưa sử dụng)"""
    return await service.delete(discount_id)