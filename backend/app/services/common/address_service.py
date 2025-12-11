from __future__ import annotations
from abc import ABC, abstractmethod
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from ...models.address import Address, BuyerAddress, SellerAddress
from ...schemas.address import AddressCreate, AddressUpdate


class BaseAddressService(ABC):

    def __init__(self, db: AsyncSession):
        self.db = db


    async def _create_core_address(self, payload: AddressCreate):
        """Tạo bản ghi Address gốc (Async)"""
        address = Address(**payload.model_dump())
        self.db.add(address)
        await self.db.commit()
        await self.db.refresh(address)

        return address


    async def _cleanup_orphan_address(self, address_id: int):
        """
        Dọn dẹp Address gốc nếu không còn ai dùng.
        """
        # Kiểm tra bảng BuyerAddress
        stmt_buyer = select(BuyerAddress.buyer_address_id).where(BuyerAddress.address_id == address_id).limit(1)
        res_buyer = await self.db.execute(stmt_buyer)

        # Kiểm tra bảng SellerAddress
        stmt_seller = select(SellerAddress.seller_address_id).where(SellerAddress.address_id == address_id).limit(1)
        res_seller = await self.db.execute(stmt_seller)

        # Nếu cả 2 đều không tìm thấy xóa Address gốc
        if not res_buyer.first() and not res_seller.first():
            stmt_delete = delete(Address).where(Address.address_id == address_id)
            await self.db.execute(stmt_delete)
            await self.db.commit()


    @abstractmethod
    async def list(self, user_id: int):
        pass


    @abstractmethod
    async def create_and_link(self, user_id: int, payload: AddressCreate, is_default: bool, label: str):
        pass


    @abstractmethod
    async def update_link(self, user_id: int, link_id: int, payload):
        pass


    @abstractmethod
    async def update_content(self, user_id: int, link_id: int, payload: AddressUpdate):
        pass


    @abstractmethod
    async def delete(self, user_id: int, link_id: int):
        pass


    @abstractmethod
    async def set_default(self, user_id: int, link_id: int):
        pass