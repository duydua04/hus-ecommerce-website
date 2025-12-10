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
    Lấy danh sách địa chỉ.
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
    """Cập nhật thông tin liên kết"""
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
    """Cập nhật nội dung địa chỉ gốc"""
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
    """Set mặc định"""
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
    """Xóa địa chỉ"""
    seller_id = seller_info["user"].seller_id

    return await service.delete(
        user_id=seller_id,
        link_id=seller_address_id
    )