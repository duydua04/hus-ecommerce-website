from __future__ import annotations
from abc import ABC, abstractmethod

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from ...config.s3 import public_url
from ...models import Carrier
from ...schemas.carrier import CarrierOut


class BaseCarrierService(ABC):

    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis
        self.TTL = 3600


    async def _get_carrier_or_404(self, carrier_id: int): # <--- async def
        carr = await self.db.get(Carrier, carrier_id)
        if not carr:
            raise HTTPException(status_code=404, detail="Carrier not found")

        return carr


    @staticmethod
    def _to_response(c: Carrier):
        return CarrierOut(
            carrier_id=c.carrier_id,
            carrier_name=c.carrier_name,
            carrier_avt_url=public_url(c.carrier_avt_url) if c.carrier_avt_url else None,
            base_price=c.base_price,
            price_per_kg=c.price_per_kg,
            is_active=c.is_active,
        )

    async def get_carrier(self, carrier_id: int):
        """
        Lấy chi tiết Carrier.
        """
        cache_key = f"carrier:{carrier_id}"

        cached = await self.redis.get(cache_key)

        if cached:
            return CarrierOut.model_validate_json(cached)

        carr = await self._get_carrier_or_404(carrier_id)

        data = CarrierOut.model_validate(carr)
        await self.redis.set(cache_key, data.model_dump_json(), ex=self.TTL)

        return data

    async def _clear_cache(self, carrier_id: int = None):
        """Hàm xóa cache dùng chung"""
        if carrier_id:
            await self.redis.delete(f"carrier:{carrier_id}")

        # Xóa tất cả các loại list (của admin lẫn buyer)
        keys = []
        async for key in self.redis.scan_iter("carrier:list:*"):
            keys.append(key)
        if keys:
            await self.redis.delete(*keys)


    @abstractmethod
    async def list_carrier(self, q: str | None, limit: int, offset: int):
        pass

