from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from fastapi import Depends
from typing import List

from ..common.carrier_service import BaseCarrierService
from ...models import Carrier
from ...schemas.carrier import CarrierOut
from ...config.db import get_db
from ...config.redis import get_redis_client
from pydantic import TypeAdapter

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

def get_buyer_carrier_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client),
):
    return BuyerCarrierService(db=db, redis=redis)