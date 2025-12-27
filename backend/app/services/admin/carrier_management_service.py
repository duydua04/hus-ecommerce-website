from __future__ import annotations

from fastapi import HTTPException, status, UploadFile, Depends
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from sqlalchemy.sql.expression import asc

from ..common.carrier_service import BaseCarrierService
from ...config.db import get_db
from ...config.redis import get_redis_client
from ...models import Carrier, Order
from ...schemas.carrier import CarrierCreate, CarrierUpdate, CarrierOut
from ...utils.storage import storage


class AdminCarrierService(BaseCarrierService):

    def __init__(self, db: AsyncSession, redis: Redis):
        super().__init__(db, redis)

    async def _ensure_unique_name(self, name: str, exclude_id: int = None):
        stmt = select(Carrier).where(
            func.lower(Carrier.carrier_name) == func.lower(name),
            Carrier.is_active.is_(True)
        )

        if exclude_id:
            stmt = stmt.where(Carrier.carrier_id != exclude_id)

        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Carrier name exists"
            )


    async def _has_orders(self, carrier_id: int):
        """Kiem tra don vi van chuyen co order hay khong"""
        stmt = select(Order.order_id).where(Order.carrier_id == carrier_id).limit(1)
        result = await self.db.execute(stmt)

        return result.first() is not None


    async def list_carrier(self, q: str | None = None, limit: int = 10, offset: int = 0):
        stmt = select(Carrier)

        if q and q.strip():
            stmt = stmt.where(Carrier.carrier_name.ilike(f"%{q.strip()}%"))

        stmt = stmt.order_by(asc(Carrier.carrier_id))

        stmt = stmt.limit(limit).offset(offset)

        result = await self.db.execute(stmt)
        carriers = result.scalars().all()

        return [self._to_response(c) for c in carriers]


    async def create_carrier(self, payload: CarrierCreate):
        name = payload.carrier_name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name required"
            )

        await self._ensure_unique_name(name)

        carrier = Carrier(
            carrier_name=name,
            base_price=payload.base_price,
            price_per_kg=payload.price_per_kg,
            is_active=payload.is_active if payload.is_active is not None else True
        )
        try:
            self.db.add(carrier)
            await self.db.commit()
            await self.db.refresh(carrier)

            # Xóa cache list để cập nhật item mới
            await self._invalidate_cache()

        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Create failed"
            )

        return self._to_response(carrier)


    async def update_carrier(self, carrier_id: int, payload: CarrierUpdate):
        carrier = await self._get_carrier_or_404(carrier_id)

        if payload.carrier_name:
            name = payload.carrier_name.strip()
            if not name: raise HTTPException(
                status_code=400,
                detail="Name empty"
            )

            if name.lower() != carrier.carrier_name.lower():
                await self._ensure_unique_name(name, exclude_id=carrier_id)
                carrier.carrier_name = name

        if payload.base_price is not None:
            carrier.base_price = payload.base_price
        if payload.price_per_kg is not None:
            carrier.price_per_kg = payload.price_per_kg
        if payload.is_active is not None:
            carrier.is_active = payload.is_active

        await self.db.commit()
        await self.db.refresh(carrier)
        await self._invalidate_cache(carrier_id)

        return self._to_response(carrier)


    async def upload_carrier_avatar(self, carrier_id: int, file: UploadFile):
        carrier = await self._get_carrier_or_404(carrier_id)

        # Upload S3
        res = await storage.upload_file("avatars", file, max_size_mb=2)
        carrier.carrier_avt_url = res["object_key"]

        await self.db.commit()
        await self.db.refresh(carrier)
        await self._invalidate_cache(carrier_id)

        return self._to_response(carrier)


    async def delete_carrier(self, carrier_id: int):
        carrier = await self._get_carrier_or_404(carrier_id)

        if await self._has_orders(carrier_id):
            # Xóa mềm
            carrier.is_active = False
            await self.db.commit()
            result = {"deleted": False, "soft_deleted": True, "id": carrier_id}
        else:
            # Xóa cứng
            await self.db.delete(carrier)
            await self.db.commit()
            result = {"deleted": True, "id": carrier_id}

        await self._invalidate_cache(carrier_id)

        return result


def get_admin_carrier_service(
        db: AsyncSession = Depends(get_db),
        redis: Redis = Depends(get_redis_client)
):
    return AdminCarrierService(db, redis)