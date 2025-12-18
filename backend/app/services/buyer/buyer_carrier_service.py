from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from fastapi import Depends
from typing import List
from decimal import Decimal
from ..common.carrier_service import BaseCarrierService
from ...models import Carrier
from ...schemas.carrier import CarrierOut, CarrierCalculateRequest, CarrierCalculateResponse
from ...config.db import get_db
from ...config.redis import get_redis_client
from pydantic import TypeAdapter
from fastapi import HTTPException, status
from ...schemas.common import Page, PageMeta
from sqlalchemy import select, func



class BuyerCarrierService(BaseCarrierService):

    # ===================== DANH SÁCH ĐƠN VỊ VẬN CHUYỂN (PUBLIC) =====================
    async def list_carriers(self):
        adapter = TypeAdapter(list[CarrierOut])

        cached = await self.redis.get(self.CACHE_KEY_LIST)
        if cached:
            return adapter.validate_json(cached)

        stmt = select(Carrier).where(Carrier.is_active == True)
        result = await self.db.execute(stmt)
        carriers = result.scalars().all()

        data = [self._to_response(c) for c in carriers]

        await self.redis.set(
            self.CACHE_KEY_LIST,
            adapter.dump_json(data),
            ex=self.TTL
        )

        return data
    # ===================== TÍNH PHÍ VẬN CHUYỂN =====================
    async def calculate_shipping(
        self,
        carrier_id: int,
        cart_total: int,
        weight: Decimal
    ) -> CarrierCalculateResponse:
        carrier = await self.db.get(Carrier, carrier_id)

        if not carrier or not carrier.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Đơn vị vận chuyển không tồn tại hoặc không hoạt động"
            )

        weight = Decimal(weight)
        shipping_fee = (
            carrier.base_price +
            carrier.price_per_kg * weight
        )

        return CarrierCalculateResponse(
            carrier_id=carrier.carrier_id,
            shipping_fee=int(shipping_fee)
        )

    # ===================== DANH SÁCH CARRIER ÁP DỤNG CHO ĐƠN HÀNG =====================
    async def list_available_carriers(
        self,
        cart_total: int,
        limit: int,
        offset: int
    ):
        stmt = select(Carrier).where(
            Carrier.is_active == True
        )

        # COUNT
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.scalar(count_stmt)

        stmt = stmt.offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        carriers = result.scalars().all()

        data = [self._to_response(c) for c in carriers]

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )
    
def get_buyer_carrier_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client),
):
    return BuyerCarrierService(db=db, redis=redis)