from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...config.db import get_db
from ...middleware.auth import require_buyer
from ...schemas.address import (
    AddressCreate,
    AddressUpdate,
    BuyerAddressUpdate
)
from ...services.buyer.buyer_address_service import BuyerAddressService, get_buyer_address_service

router = APIRouter(
    prefix="/buyer/addresses",
    tags=["buyer_addresses"],
    dependencies=[Depends(require_buyer)]
)

# ========================= LẤY DANH SÁCH ĐỊA CHỈ CỦA BUYER HIỆN TẠI =======================

@router.get("")
async def list_addresses(
    buyer: dict = Depends(require_buyer),
    service: BuyerAddressService = Depends(get_buyer_address_service)
):
    """
    Lấy danh sách tất cả địa chỉ của buyer hiện tại.

    - Chỉ trả về các địa chỉ thuộc quyền sở hữu của buyer
    - Bao gồm địa chỉ mặc định (nếu có)
    - Yêu cầu buyer đã đăng nhập
    """
    return await service.list(buyer["user"].buyer_id)

# ================ TẠO ADRESS MẶC ĐỊNH LIÊN KẾT VỚI BUYER ========================
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_address(
    payload: AddressCreate,
    is_default: bool = False,
    label: str | None = None,
    db: AsyncSession = Depends(get_db),
    buyer=Depends(require_buyer)
):
    """
        Tạo Address gốc và liên kết với Buyer
        - Nếu là address đầu tiên → auto default
        - Nếu is_default=True → bỏ default cũ
        """
    service = BuyerAddressService(db)
    return await service.create_and_link(
        user_id=buyer["user"].buyer_id,
        payload=payload,
        is_default=is_default,
        label=label
    )

# @router.patch("/{link_id}")
# async def update_address_link(
#     link_id: int,
#     payload: BuyerAddressUpdate,
#     db: AsyncSession = Depends(get_db),
#     current_buyer=Depends(require_buyer)
# ):
#     service = BuyerAddressService(db)
#     result = await service.update_link(
#         user_id=current_buyer.id,
#         link_id=link_id,
#         payload=payload
#     )

#     if not result:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Address not found"
#         )

#     return result

# @router.put("/{link_id}/content")
# async def update_address_content(
#     link_id: int,
#     payload: AddressUpdate,
#     db: AsyncSession = Depends(get_db),
#     current_buyer=Depends(require_buyer)
# ):
#     service = BuyerAddressService(db)
#     result = await service.update_content(
#         user_id=current_buyer.id,
#         link_id=link_id,
#         payload=payload
#     )

#     if not result:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Address not found"
#         )

#     return result

# @router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_address(
#     link_id: int,
#     db: AsyncSession = Depends(get_db),
#     current_buyer=Depends(require_buyer)
# ):
#     service = BuyerAddressService(db)
#     success = await service.delete(
#         user_id=current_buyer.id,
#         link_id=link_id
#     )

#     if not success:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Address not found"
#         )

# @router.post("/{link_id}/default")
# async def set_default_address(
#     link_id: int,
#     db: AsyncSession = Depends(get_db),
#     current_buyer=Depends(require_buyer)
# ):
#     service = BuyerAddressService(db)
#     result = await service.set_default(
#         user_id=current_buyer.id,
#         link_id=link_id
#     )

#     if not result:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Address not found"
#         )

#     return result
