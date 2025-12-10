from fastapi import APIRouter, Depends
from ...middleware.auth import require_seller
from ...schemas.user import SellerResponse, SellerUpdate
from ...services.seller.seller_profile_service import SellerProfileService, get_seller_profile_service

router = APIRouter(
    prefix="/seller/profile",
    tags=["seller-profile"]
)


@router.get("/", response_model=SellerResponse)
async def get_my_profile(
        seller_info=Depends(require_seller),
        service: SellerProfileService = Depends(get_seller_profile_service)
):
    """Lấy thông tin hồ sơ Seller"""
    seller_id = seller_info["user"].seller_id

    # [ASYNC] Thêm await
    return await service.get_info(seller_id)


@router.put("/", response_model=SellerResponse)
async def update_my_profile(
        payload: SellerUpdate,
        seller_info=Depends(require_seller),
        service: SellerProfileService = Depends(get_seller_profile_service)
):
    """Cập nhật thông tin hồ sơ Seller"""
    seller_id = seller_info["user"].seller_id

    # [ASYNC] Thêm await
    return await service.update_info(seller_id, payload)