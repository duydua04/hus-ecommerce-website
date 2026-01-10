from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ...schemas.common import BuyerAddressLabel
from ...middleware.auth import require_buyer
from ...schemas.address import (
    AddressCreate,
    AddressUpdate,
    BuyerAddressUpdate,
    BuyerAddressResponse
)
from ...services.buyer.buyer_address_service import BuyerAddressService, get_buyer_address_service

router = APIRouter(
    prefix="/buyer/addresses",
    tags=["buyer_addresses"],
    dependencies=[Depends(require_buyer)]
)

# ========================= LẤY DANH SÁCH ĐỊA CHỈ CỦA BUYER HIỆN TẠI =======================

@router.get("", response_model=List[BuyerAddressResponse])
async def get_list_buyer_address(
    buyer_info=Depends(require_buyer),
    service: BuyerAddressService = Depends(get_buyer_address_service),
):
    """
    **Lấy danh sách tất cả địa chỉ nhận hàng của Người mua.**

    Dữ liệu bao gồm thông tin chi tiết địa chỉ và các thuộc tính liên kết (mặc định, nhãn).

    - **Yêu cầu**: Người dùng đã đăng nhập với quyền **Buyer**.
    """
    buyer_id = buyer_info["user"].buyer_id
    return await service.list(buyer_id)

# ================ TẠO ADRESS MẶC ĐỊNH LIÊN KẾT VỚI BUYER ========================
@router.post("/create-and-link", response_model=BuyerAddressResponse)
async def create_and_link_address(
    payload: AddressCreate,
    is_default: bool = False,
    label: Optional[BuyerAddressLabel] = None,
    buyer_info=Depends(require_buyer),
    service: BuyerAddressService = Depends(get_buyer_address_service),
):
    """
    **Tạo địa chỉ mới và liên kết trực tiếp vào tài khoản.**

    ### Tham số:
    - **payload**: Thông tin địa chỉ (Tỉnh/Thành, Quận/Huyện, Phường/Xã, Số nhà...).
    - **is_default**: Nếu `true`, địa chỉ này sẽ tự động trở thành địa chỉ mặc định cho các đơn hàng sau.
    - **label**: Phân loại địa chỉ (VD: `home`, `office`).

    ### Quy tắc hệ thống:
    - Nếu đây là địa chỉ **đầu tiên** được tạo, hệ thống sẽ tự động đặt làm mặc định bất kể giá trị `is_default`.
    """
    buyer_id = buyer_info["user"].buyer_id

    return await service.create_and_link(
        user_id=buyer_id,
        payload=payload,
        is_default=is_default,
        label=label,
    )
# ============= CẬP NHẬT THÔNG TIN LIÊN KẾT ĐỊA CHỈ ==============
@router.patch("/{buyer_address_id}", response_model=BuyerAddressResponse)
async def update_link_info(
    buyer_address_id: int,
    payload: BuyerAddressUpdate,
    buyer_info=Depends(require_buyer),
    service: BuyerAddressService = Depends(get_buyer_address_service),
):
    """
    **Cập nhật thông tin bổ trợ của địa chỉ.**

    Dùng để thay đổi Nhãn (Label) hoặc trạng thái mặc định mà không làm thay đổi nội dung địa chỉ gốc.
    """
    buyer_id = buyer_info["user"].buyer_id

    return await service.update_link(
        user_id=buyer_id,
        link_id=buyer_address_id,
        payload=payload,
    )

# ============= CẬP NHẬT NỘI DUNG ĐỊA CHỉ ==============
@router.patch("/{buyer_address_id}/address", response_model=BuyerAddressResponse)
async def update_address_content(
    buyer_address_id: int,
    payload: AddressUpdate,
    buyer_info=Depends(require_buyer),
    service: BuyerAddressService = Depends(get_buyer_address_service),
):
    """
    **Cập nhật nội dung chi tiết của địa chỉ.**

    Dùng khi người dùng sửa lại số nhà, tên đường hoặc thông tin hành chính của một địa chỉ đã lưu.
    """
    buyer_id = buyer_info["user"].buyer_id

    return await service.update_content(
        user_id=buyer_id,
        link_id=buyer_address_id,
        payload=payload,
    )
# ==================== XÓA LIÊN KẾT ĐỊA CHỈ =================
@router.delete("/{buyer_address_id}")
async def delete_address(
    buyer_address_id: int,
    buyer_info=Depends(require_buyer),
    service: BuyerAddressService = Depends(get_buyer_address_service),
):
    """Xóa địa chỉ"""
    buyer_id = buyer_info["user"].buyer_id

    return await service.delete(
        user_id=buyer_id,
        link_id=buyer_address_id,
    )
# =============== SET ĐỊA CHỈ MẶC ĐỊNH =============
@router.patch("/{buyer_address_id}/default", response_model=BuyerAddressResponse)
async def set_default_address(
    buyer_address_id: int,
    buyer_info=Depends(require_buyer),
    service: BuyerAddressService = Depends(get_buyer_address_service),
):
    """
    **Thiết lập địa chỉ làm mặc định.**

    Khi một địa chỉ được chọn làm mặc định, trạng thái mặc định của các địa chỉ khác thuộc Buyer này sẽ tự động bị hủy bỏ.
    """
    buyer_id = buyer_info["user"].buyer_id

    await service.set_default(
        user_id=buyer_id,
        link_id=buyer_address_id
    )

    return await service.update_link(
        user_id=buyer_id,
        link_id=buyer_address_id,
        payload=BuyerAddressUpdate(is_default=True),
    )
