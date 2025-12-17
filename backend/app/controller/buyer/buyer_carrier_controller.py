from fastapi import APIRouter, Depends
from typing import List

from ...schemas.carrier import CarrierOut
from ...services.buyer.buyer_carrier_service import (
    BuyerCarrierService,
    get_buyer_carrier_service
)

router = APIRouter(
    prefix="/buyer/carriers",
    tags=["buyer_carrier"]
)


# ===================== ĐƯA RA DANH SÁCH ĐƠN VỊ VẬN CHUYỂN =====================
@router.get("/", response_model=List[CarrierOut])
async def list_carriers(
    service: BuyerCarrierService = Depends(get_buyer_carrier_service)
):
    return await service.list_carriers()


# ===================== ĐƯA RA CHI TIẾT ĐƠN VỊ VẬN CHUYỂN =====================
@router.get("/{carrier_id}", response_model=CarrierOut)
async def get_carrier_detail(
    carrier_id: int,
    service: BuyerCarrierService = Depends(get_buyer_carrier_service)
):
    return await service.get_carrier(carrier_id)
