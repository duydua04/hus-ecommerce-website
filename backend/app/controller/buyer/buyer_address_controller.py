from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...config.db import get_db
from ...middleware.auth import require_buyer
from ...schemas.address import (
    AddressCreate,
    AddressUpdate,
    BuyerAddressUpdate,
    BuyerAddressResponseOrder
)
from ...services.buyer.buyer_address_service import BuyerAddressService, get_buyer_address_service

router = APIRouter(
    prefix="/buyer/addresses",
    tags=["buyer_addresses"],
    dependencies=[Depends(require_buyer)]
)

# ========================= LẤY DANH SÁCH ĐỊA CHỈ CỦA BUYER HIỆN TẠI =======================

@router.get(
    "",
    response_model=List[BuyerAddressResponseOrder]
)
async def list_addresses(
    buyer: dict = Depends(require_buyer),
    service: BuyerAddressService = Depends(get_buyer_address_service)
):
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

@router.patch("/{link_id}")
async def update_address_link(
    buyer_address_id: int,
    payload: BuyerAddressUpdate,
    db: AsyncSession = Depends(get_db),
    buyer=Depends(require_buyer)
):
    """
        Cập nhật thông tin liên kết (label, is_default)
    """
    service = BuyerAddressService(db)
    result = await service.update_link(
        user_id=buyer["user"].buyer_id,
        buyer_address_id=buyer_address_id,
        payload=payload
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )

    return result

# ============= CẬP NHẬT NỘI DUNG ĐỊA CHỉ ==============
@router.put("/{link_id}/content")
async def update_address_content(
    buyer_address_id: int,
    payload: AddressUpdate,
    db: AsyncSession = Depends(get_db),
    buyer=Depends(require_buyer)
):
    """
        Cập nhật nội dung Address gốc
        """
    service = BuyerAddressService(db)
    result = await service.update_content(
        user_id=buyer["user"].buyer_id,
        buyer_address_id=buyer_address_id,
        payload=payload
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )

    return result

# ==================== XÓA LIÊN KẾT ĐỊA CHỈ =================
@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    buyer_address_id: int,
    db: AsyncSession = Depends(get_db),
    buyer=Depends(require_buyer)
):
    """
        Xóa liên kết BuyerAddress và dọn Address nếu bị orphan
    """
    service = BuyerAddressService(db)
    success = await service.delete(
        user_id=buyer["user"].buyer_id,
        buyer_address_id=buyer_address_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    return {"message": f"✅ Xóa địa chỉ thành công"}

# =============== SET ĐỊA CHỈ MẶC ĐỊNH =============
@router.post("/{link_id}/default")
async def set_default_address(
    buyer_address_id: int,
    db: AsyncSession = Depends(get_db),
    buyer=Depends(require_buyer)
):
    """
        Set một địa chỉ làm mặc định
    """
    service = BuyerAddressService(db)
    result = await service.set_default(
        user_id=buyer["user"].buyer_id,
        buyer_address_id=buyer_address_id
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )

    return result
