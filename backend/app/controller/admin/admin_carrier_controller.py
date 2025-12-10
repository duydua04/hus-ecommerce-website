from typing import List, Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from ...middleware.auth import require_admin
from ...schemas.carrier import CarrierCreate, CarrierUpdate, CarrierOut
from ...services.admin.carrier_management_service import (
    AdminCarrierService,
    get_admin_carrier_service
)

router = APIRouter(
    prefix="/admin/carriers",
    tags=["admin-carriers"],
    dependencies=[Depends(require_admin)]
)


@router.get("/", response_model=List[CarrierOut])
async def admin_list_carriers(
    q: Optional[str] = Query(None, description="Search by name"),
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """
    Lấy danh sách đơn vị vận chuyển.
    Admin xem được cả active và inactive.
    """
    return await service.list_carrier(q=q, limit=limit, offset=offset)


@router.post("/", response_model=CarrierOut, status_code=status.HTTP_201_CREATED)
async def admin_create_carrier(
    payload: CarrierCreate,
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """Thêm đơn vị vận chuyển mới"""
    return await service.create_carrier(payload)


@router.patch("/{carrier_id}", response_model=CarrierOut)
async def admin_update_carrier(
    carrier_id: int,
    payload: CarrierUpdate,
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """Cập nhật thông tin"""
    return await service.update_carrier(carrier_id, payload)


@router.post("/{carrier_id}/upload-avatar", response_model=CarrierOut)
async def admin_upload_carrier_avatar(
    carrier_id: int,
    avatar: UploadFile = File(...),
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """Upload Logo/Avatar cho đơn vị vận chuyển"""
    return await service.upload_carrier_avatar(carrier_id, avatar)


@router.delete("/{carrier_id}")
async def admin_delete_carrier(
    carrier_id: int,
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """
    Xóa đơn vị vận chuyển.
    - Nếu đã có đơn hàng: Xóa mềm (is_active = False).
    - Nếu chưa có đơn hàng: Xóa cứng khỏi DB.
    """
    return await service.delete_carrier(carrier_id)