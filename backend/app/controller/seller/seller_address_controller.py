from typing import List, Optional
from fastapi import APIRouter, Depends

from ...middleware.auth import require_seller

from ...schemas.address import (
    AddressCreate, AddressUpdate,
    SellerAddressUpdate, SellerAddressResponse
)
from ...schemas.common import SellerAddressLabel

from ...services.seller.seller_address_service import (
    SellerAddressService,
    get_seller_address_service
)


router = APIRouter(
    prefix="/seller/addresses",
    tags=["seller_addresses"]
)


@router.get("", response_model=List[SellerAddressResponse])
async def get_list_seller_address(
        seller_info=Depends(require_seller),
        service: SellerAddressService = Depends(get_seller_address_service)
):
    """
    **Lấy danh sách tất cả địa chỉ của Nhà bán hàng.**

    Dùng để hiển thị các địa chỉ mà Seller đã đăng ký (Kho hàng, văn phòng, nơi lấy hàng).

    - **Yêu cầu**: Phải đăng nhập với quyền **Seller**.
    """
    seller_id = seller_info["user"].seller_id
    return await service.list(seller_id)


@router.post("/create-and-link", response_model=SellerAddressResponse)
async def create_and_link_address(
        payload: AddressCreate,
        is_default: bool = False,
        label: Optional[SellerAddressLabel] = None,
        seller_info=Depends(require_seller),
        service: SellerAddressService = Depends(get_seller_address_service)
):
    """Tạo và liên kết địa chỉ mới"""
    seller_id = seller_info["user"].seller_id

    return await service.create_and_link(
        user_id=seller_id,
        payload=payload,
        is_default=is_default,
        label=label
    )


@router.patch("/{seller_address_id}", response_model=SellerAddressResponse)
async def update_link_info(
        seller_address_id: int,
        payload: SellerAddressUpdate,
        seller_info=Depends(require_seller),
        service: SellerAddressService = Depends(get_seller_address_service)
):
    """
    **Cập nhật thông tin bổ trợ (Nhãn/Mặc định).**

    Dùng để đổi nhãn địa chỉ hoặc thay đổi ghi chú liên kết mà không sửa đổi vị trí địa lý của địa chỉ đó.
    """
    seller_id = seller_info["user"].seller_id

    return await service.update_link(
        user_id=seller_id,
        link_id=seller_address_id,
        payload=payload
    )


@router.patch("/{seller_address_id}/address", response_model=SellerAddressResponse)
async def update_address_content(
        seller_address_id: int,
        payload: AddressUpdate,
        seller_info=Depends(require_seller),
        service: SellerAddressService = Depends(get_seller_address_service)
):
    """
    **Cập nhật nội dung địa lý của địa chỉ.**

    Dùng khi Seller thay đổi số nhà, tên đường hoặc chuyển văn phòng/kho sang vị trí khác.
    """
    seller_id = seller_info["user"].seller_id

    return await service.update_content(
        user_id=seller_id,
        link_id=seller_address_id,
        payload=payload
    )


@router.patch("/{seller_address_id}/default", response_model=SellerAddressResponse)
async def set_default_address(
        seller_address_id: int,
        seller_info=Depends(require_seller),
        service: SellerAddressService = Depends(get_seller_address_service)
):
    """
    **Thiết lập địa chỉ lấy hàng mặc định.**

    Hệ thống sẽ sử dụng địa chỉ này để tính toán phí vận chuyển và gửi cho đơn vị vận chuyển khi có đơn hàng mới.
    """
    seller_id = seller_info["user"].seller_id

    await service.set_default(user_id=seller_id, link_id=seller_address_id)

    return await service.update_link(
        user_id=seller_id,
        link_id=seller_address_id,
        payload=SellerAddressUpdate(is_default=True)
    )


@router.delete("/{seller_address_id}")
async def delete_address(
        seller_address_id: int,
        seller_info=Depends(require_seller),
        service: SellerAddressService = Depends(get_seller_address_service)
):
    """Xóa địa chỉ khỏi hệ thống"""
    seller_id = seller_info["user"].seller_id

    return await service.delete(
        user_id=seller_id,
        link_id=seller_address_id
    )