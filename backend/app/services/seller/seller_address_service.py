from __future__ import annotations
import json

from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status, Depends
from redis.asyncio import Redis

from ...config.db import get_db
from ...config.redis import get_redis_client
from ...models.address import SellerAddress
from ...schemas.address import AddressCreate, AddressUpdate, SellerAddressUpdate, SellerAddressResponse
from ..common.address_service import BaseAddressService


class SellerAddressService(BaseAddressService):

    def __init__(self, db: AsyncSession, redis: Redis):
        super().__init__(db)
        self.redis = redis
        self.TTL = 86400

    async def _clear_user_cache(self, user_id: int):
        key = f"address:seller:{user_id}:list"
        await self.redis.delete(key)

    async def list(self, user_id: int):
        """
        Lấy danh sách địa chỉ.
        """
        cache_key = f"address:seller:{user_id}:list"

        if cached := await self.redis.get(cache_key):
            try:
                data_list = json.loads(cached)
                return [SellerAddressResponse(**item) for item in data_list]
            except Exception:
                pass

        stmt = (
            select(SellerAddress)
            .options(selectinload(SellerAddress.address))
            .where(SellerAddress.seller_id == user_id)
            .order_by(SellerAddress.is_default.desc(),
                      SellerAddress.seller_address_id.desc()
                      )
        )
        result = await self.db.execute(stmt)
        items = result.scalars().all()

        response_data = [SellerAddressResponse.model_validate(item) for item in items]
        json_str = json.dumps([item.model_dump() for item in response_data])

        await self.redis.set(cache_key, json_str, ex=self.TTL)

        return response_data

    async def create_and_link(
            self, user_id: int,
            payload: AddressCreate,
            is_default: bool = False,
            label: str = None
    ):
        core_addr = await self._create_core_address(payload)

        link = SellerAddress(
            seller_id=user_id,
            address_id=core_addr.address_id,
            is_default=is_default,
            label=label
        )
        self.db.add(link)
        await self.db.commit()

        await self.db.refresh(link, attribute_names=["address"])

        if is_default:
            await self.set_default(user_id, link.seller_address_id)


        await self._clear_user_cache(user_id)

        return link

    async def update_link(
            self, user_id: int,
            link_id: int, payload: SellerAddressUpdate
    ):
        stmt = (
            select(SellerAddress)
            .options(selectinload(SellerAddress.address))
            .where(SellerAddress.seller_address_id == link_id)
        )
        result = await self.db.execute(stmt)
        link = result.scalar_one_or_none()

        if not link or link.seller_id != user_id:
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

    async def update_content(self, user_id: int, link_id: int, payload: AddressUpdate):
        stmt = (
            select(SellerAddress)
            .options(selectinload(SellerAddress.address))
            .where(SellerAddress.seller_address_id == link_id)
        )
        result = await self.db.execute(stmt)
        link = result.scalar_one_or_none()

        if not link or link.seller_id != user_id:
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

    async def delete(self, user_id: int, link_id: int):
        stmt = select(SellerAddress).where(SellerAddress.seller_address_id == link_id)
        result = await self.db.execute(stmt)
        link = result.scalar_one_or_none()

        if not link or link.seller_id != user_id:
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

    async def set_default(self, user_id: int, link_id: int):
        """
        Logic: Set toàn bộ địa chỉ của user này về False -> Set cái được chọn về True.
        """
        # Set tất cả về False
        stmt1 = (
            update(SellerAddress)
            .where(SellerAddress.seller_id == user_id)
            .values(is_default=False)
        )
        await self.db.execute(stmt1)

        # Set cái được chọn về True
        stmt2 = (
            update(SellerAddress)
            .where(SellerAddress.seller_address_id == link_id)
            .values(is_default=True)
        )
        await self.db.execute(stmt2)

        await self.db.commit()
        await self._clear_user_cache(user_id)


def get_seller_address_service(
        db: AsyncSession = Depends(get_db),
        redis: Redis = Depends(get_redis_client)
):
    return SellerAddressService(db, redis)