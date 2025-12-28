from fastapi import APIRouter, Depends
from ...middleware.auth import require_buyer
from ...schemas.user import BuyerResponse, BuyerUpdate
from ...services.buyer.buyer_profile_service import (
    BuyerProfileService,
    get_buyer_profile_service
)

router = APIRouter(
    prefix="/buyer/profile",
    tags=["buyer-profile"]
)

# ==================== LẤY THÔNG TIN HỒ SƠ BUYER ====================
@router.get("/", response_model=BuyerResponse)
async def get_my_profile(
        buyer_info=Depends(require_buyer),
        service: BuyerProfileService = Depends(get_buyer_profile_service)
):
    """Lấy thông tin hồ sơ Buyer"""
    buyer_id = buyer_info["user"].buyer_id

    return await service.get_info(buyer_id)


# ==================== CẬP NHẬT THÔNG TIN HỒ SƠ BUYER ====================
@router.put("/", response_model=BuyerResponse)
async def update_my_profile(
        payload: BuyerUpdate,
        buyer_info=Depends(require_buyer),
        service: BuyerProfileService = Depends(get_buyer_profile_service)
):
    """Cập nhật thông tin hồ sơ Buyer"""
    buyer_id = buyer_info["user"].buyer_id

    return await service.update_info(buyer_id, payload)