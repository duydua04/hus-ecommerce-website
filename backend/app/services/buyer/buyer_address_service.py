from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..common.address_service import BaseAddressService
from ...models.address import Address, BuyerAddress
from ...schemas.address import AddressCreate, AddressUpdate
from ...config.db import get_db
from fastapi import Depends

class BuyerAddressService(BaseAddressService):

    async def list(self, user_id: int):
        """
        Danh sách địa chỉ của buyer
        """
        stmt = (
            select(BuyerAddress, Address)
            .join(Address, BuyerAddress.address_id == Address.address_id)
            .where(BuyerAddress.buyer_id == user_id)
            .order_by(BuyerAddress.is_default.desc())
        )
        res = await self.db.execute(stmt)
        return res.all()


    async def create_and_link(
        self,
        user_id: int,
        payload: AddressCreate,
        is_default: bool,
        label: str
    ):
        """
        Tạo Address gốc và liên kết với Buyer
        """
        # Nếu đặt làm default → bỏ default cũ
        if is_default:
            await self.db.execute(
                update(BuyerAddress)
                .where(BuyerAddress.buyer_id == user_id)
                .values(is_default=False)
            )

        # Tạo address gốc
        address = await self._create_core_address(payload)

        # Tạo bảng liên kết
        buyer_address = BuyerAddress(
            buyer_id=user_id,
            address_id=address.address_id,
            is_default=is_default,
            label=label
        )
        self.db.add(buyer_address)
        await self.db.commit()
        await self.db.refresh(buyer_address)

        return buyer_address


    async def update_link(
        self,
        user_id: int,
        link_id: int,
        payload
    ):
        """
        Cập nhật thông tin liên kết (label, is_default)
        """
        stmt = select(BuyerAddress).where(
            BuyerAddress.buyer_address_id == link_id,
            BuyerAddress.buyer_id == user_id
        )
        res = await self.db.execute(stmt)
        buyer_address = res.scalar_one_or_none()

        if not buyer_address:
            return None

        # Nếu set default
        if payload.is_default:
            await self.db.execute(
                update(BuyerAddress)
                .where(BuyerAddress.buyer_id == user_id)
                .values(is_default=False)
            )

        buyer_address.is_default = payload.is_default
        buyer_address.label = payload.label

        await self.db.commit()
        await self.db.refresh(buyer_address)

        return buyer_address


    async def update_content(
        self,
        user_id: int,
        link_id: int,
        payload: AddressUpdate
    ):
        """
        Cập nhật nội dung Address gốc
        """
        stmt = (
            select(Address)
            .join(BuyerAddress, BuyerAddress.address_id == Address.address_id)
            .where(
                BuyerAddress.buyer_address_id == link_id,
                BuyerAddress.buyer_id == user_id
            )
        )
        res = await self.db.execute(stmt)
        address = res.scalar_one_or_none()

        if not address:
            return None

        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(address, key, value)

        await self.db.commit()
        await self.db.refresh(address)

        return address


    async def delete(self, user_id: int, link_id: int):
        """
        Xóa liên kết BuyerAddress và dọn Address nếu bị orphan
        """
        stmt = select(BuyerAddress).where(
            BuyerAddress.buyer_address_id == link_id,
            BuyerAddress.buyer_id == user_id
        )
        res = await self.db.execute(stmt)
        buyer_address = res.scalar_one_or_none()

        if not buyer_address:
            return False

        address_id = buyer_address.address_id

        await self.db.delete(buyer_address)
        await self.db.commit()

        # Dọn Address nếu không còn liên kết
        await self._cleanup_orphan_address(address_id)

        return True


    async def set_default(self, user_id: int, link_id: int):
        """
        Set một địa chỉ làm mặc định
        """
        stmt = select(BuyerAddress).where(
            BuyerAddress.buyer_address_id == link_id,
            BuyerAddress.buyer_id == user_id
        )
        res = await self.db.execute(stmt)
        buyer_address = res.scalar_one_or_none()

        if not buyer_address:
            return None

        # Bỏ default cũ
        await self.db.execute(
            update(BuyerAddress)
            .where(BuyerAddress.buyer_id == user_id)
            .values(is_default=False)
        )

        buyer_address.is_default = True
        await self.db.commit()
        await self.db.refresh(buyer_address)

        return buyer_address

def get_buyer_address_service(
    db: AsyncSession = Depends(get_db),
):
    return BuyerAddressService(db)