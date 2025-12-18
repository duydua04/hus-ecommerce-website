from fastapi import APIRouter, Depends, Query
from typing import List
from sqlalchemy.orm import Session, Query as SAQuery
from ...middleware.auth import require_buyer
from ...schemas.common import Page
from ...schemas.carrier import CarrierOut, CarrierCalculateResponse, CarrierCalculateRequest
from ...services.buyer.buyer_carrier_service import (
    BuyerCarrierService,
    get_buyer_carrier_service
)

router = APIRouter(
    prefix="/buyer/carriers",
    tags=["buyer_carrier"],
    dependencies=[Depends(require_buyer)]
)


# ===================== ĐƯA RA DANH SÁCH ĐƠN VỊ VẬN CHUYỂN =====================
@router.get("/", response_model=List[CarrierOut])
async def list_carriers(
    service: BuyerCarrierService = Depends(get_buyer_carrier_service)
):
    """
    API lấy danh sách đơn vị vận chuyển cho người dùng.

    Chức năng:
    - Trả về danh sách các đơn vị vận chuyển đang hoạt động
    - Dùng cho màn hình chọn đơn vị vận chuyển khi đặt hàng
    """

    return await service.list_carriers()

# ===================== TÍNH PHÍ VẬN CHUYỂN =====================
@router.post(
    "/calculate",
    response_model=CarrierCalculateResponse
)
async def calculate_shipping(
    payload: CarrierCalculateRequest,
    service: BuyerCarrierService = Depends(get_buyer_carrier_service)
):
    """
    API tính phí vận chuyển cho đơn hàng.

    Chức năng:
    - Tính phí vận chuyển dựa trên đơn vị vận chuyển được chọn
    - Dùng cho bước chọn đơn vị vận chuyển khi checkout
    """
    return await service.calculate_shipping(
        carrier_id=payload.carrier_id,
        cart_total=payload.cart_total,
        weight=payload.weight
    )

# ===================== CARRIER ÁP DỤNG CHO ĐƠN HÀNG =====================
@router.post(
    "/available",
    response_model=Page
)
async def available_carriers(
    cart_total: int = Query(..., gt=0),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: BuyerCarrierService = Depends(get_buyer_carrier_service)
):
    """
    API lấy danh sách đơn vị vận chuyển có thể áp dụng cho đơn hàng.

    Chức năng:
    - Trả về các đơn vị vận chuyển đang hoạt động
    - Dùng cho bước chọn đơn vị vận chuyển khi checkout
    - Có hỗ trợ phân trang
    """
    return await service.list_available_carriers(
        cart_total=cart_total,
        limit=limit,
        offset=offset
    )

# ===================== ĐƯA RA CHI TIẾT ĐƠN VỊ VẬN CHUYỂN =====================
@router.get("/{carrier_id}", response_model=CarrierOut)
async def get_carrier_detail(
    carrier_id: int,
    service: BuyerCarrierService = Depends(get_buyer_carrier_service)
):
    """
    API lấy thông tin chi tiết của đơn vị vận chuyển.

    Chức năng:
    - Trả về thông tin chi tiết của một đơn vị vận chuyển cụ thể
    - Dùng cho màn hình xem chi tiết hoặc xác nhận đơn vị vận chuyển
    """
    return await service.get_carrier(carrier_id)
