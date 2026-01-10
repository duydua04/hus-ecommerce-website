import json
from fastapi import Depends, HTTPException, status
from redis import Redis
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# Internal configuration and database
from ...config.db import get_db
from ...config.redis import get_redis_client

# Models and Services
from ...models.address import  BuyerAddress
from ..common.address_service import BaseAddressService

# Schemas
from ...schemas.address import (
    AddressCreate,
    AddressUpdate,
    BuyerAddressResponse,
    BuyerAddressUpdate,
)

class BuyerAddressService(BaseAddressService):
    def __init__(self, db: AsyncSession, redis: Redis):
        super().__init__(db)
        self.redis = redis
        self.TTL = 86400
    async def _clear_user_cache(self, user_id: int):
        key = f"address:buyer:{user_id}:list"
        await self.redis.delete(key)
    
    # ============== DANH SÁCH ĐỊA CHỈ CỦA BUYER =======================
    async def list(self, user_id: int):
        cache_key = f"address:buyer:{user_id}:list"

        if cached := await self.redis.get(cache_key):
            try:
                data_list = json.loads(cached)
                return [BuyerAddressResponse(**item) for item in data_list]
            except Exception:
                pass

        stmt = (
            select(BuyerAddress)
            .options(selectinload(BuyerAddress.address))
            .where(BuyerAddress.buyer_id == user_id)
            .order_by(
                BuyerAddress.is_default.desc(),
                BuyerAddress.buyer_address_id.desc()
            )
        )

        result = await self.db.execute(stmt)
        items = result.scalars().all()

        response_data = [
            BuyerAddressResponse.model_validate(item)
            for item in items
        ]

        await self.redis.set(
            cache_key,
            json.dumps([item.model_dump() for item in response_data]),
            ex=self.TTL
        )

        return response_data

    # ================ TẠO ADRESS MẶC ĐỊNH LIÊN KẾT VỚI BUYER ========================
    async def create_and_link(
        self,
        user_id: int,
        payload: AddressCreate,
        is_default: bool = False,
        label: str = None,
    ):
        core_addr = await self._create_core_address(payload)

        link = BuyerAddress(
            buyer_id=user_id,
            address_id=core_addr.address_id,
            is_default=is_default,
            label=label
        )

        self.db.add(link)
        await self.db.commit()
        await self.db.refresh(link, attribute_names=["address"])

        if is_default:
            await self.set_default(user_id, link.buyer_address_id)

        await self._clear_user_cache(user_id)
        return link

    # ============= CẬP NHẬT THÔNG TIN LIÊN KẾT VỚI ĐỊA CHỈ (LABEL, IS_DEFAULT)==============
    async def update_link(
        self,
        user_id: int,
        link_id: int,
        payload: BuyerAddressUpdate
    ):
        stmt = (
            select(BuyerAddress)
            .options(selectinload(BuyerAddress.address))
            .where(BuyerAddress.buyer_address_id == link_id)
        )
        result = await self.db.execute(stmt)
        link = result.scalar_one_or_none()

        if not link or link.buyer_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )

        data = payload.model_dump(exclude_unset=True)

        if "label" in data:
            link.label = data["label"]

        if data.get("is_default"):
            await self.set_default(user_id, link_id)
            link.is_default = True
        elif "is_default" in data and not data["is_default"]:
            link.is_default = False

        await self.db.commit()
        await self.db.refresh(link, attribute_names=["address"])
        await self._clear_user_cache(user_id)

        return link

    # ============= CẬP NHẬT NỘI DUNG ĐỊA CHỉ ==============
    async def update_content(
        self,
        user_id: int,
        link_id: int,
        payload: AddressUpdate
    ):
        stmt = (
            select(BuyerAddress)
            .options(selectinload(BuyerAddress.address))
            .where(BuyerAddress.buyer_address_id == link_id)
        )
        result = await self.db.execute(stmt)
        link = result.scalar_one_or_none()

        if not link or link.buyer_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )

        address = link.address

        for k, v in payload.model_dump(exclude_unset=True).items():
            if isinstance(v, str) and (not v.strip() or v == "string"):
                continue
            setattr(address, k, v)

        await self.db.commit()
        await self.db.refresh(link, attribute_names=["address"])
        await self._clear_user_cache(user_id)

        return link

    # ==================== XÓA LIÊN KẾT ĐỊA CHỈ =================
    async def delete(self, user_id: int, link_id: int):
        stmt = select(BuyerAddress).where(
            BuyerAddress.buyer_address_id == link_id
        )
        result = await self.db.execute(stmt)
        link = result.scalar_one_or_none()

        if not link or link.buyer_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )

        addr_id = link.address_id

        await self.db.delete(link)
        await self.db.commit()

        await self._cleanup_orphan_address(addr_id)
        await self._clear_user_cache(user_id)

        return {"deleted": True}

    # =============== SET ĐỊA CHỈ MẶC ĐỊNH =============
    async def set_default(self, user_id: int, link_id: int):
        stmt1 = (
            update(BuyerAddress)
            .where(BuyerAddress.buyer_id == user_id)
            .values(is_default=False)
        )
        await self.db.execute(stmt1)

        stmt2 = (
            update(BuyerAddress)
            .where(BuyerAddress.buyer_address_id == link_id)
            .values(is_default=True)
        )
        await self.db.execute(stmt2)

        await self.db.commit()
        await self._clear_user_cache(user_id)

def get_buyer_address_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client),
):
    return BuyerAddressService(db, redis)