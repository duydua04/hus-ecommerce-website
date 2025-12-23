from __future__ import annotations
from fastapi import HTTPException, status, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..common.discount_service import BaseDiscountService
from ...config.db import get_db
from ...schemas.discount import DiscountCreate, DiscountResponse, DiscountUpdate
from ...models.catalog import Discount
from ...models.order import Order


class AdminDiscountService(BaseDiscountService):

    def __init__(self, db: AsyncSession):
        super().__init__(db)


    async def list(self, q: str | None = None, limit: int = 10, offset: int = 0):
        """Admin xem được tất cả"""
        stmt = select(Discount)

        if q and q.strip():
            stmt = stmt.where(Discount.code.ilike(f"%{q.strip()}%"))

        return await self._build_list_response(stmt, limit, offset)


    async def create(self, payload: DiscountCreate):
        item = Discount(**payload.model_dump())
        self.db.add(item)  # add là sync

        try:
            await self.db.commit()
            await self.db.refresh(item)
        except IntegrityError as e:
            await self.db.rollback()  # rollback async
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Discount code exists"
            ) from e

        return DiscountResponse.model_validate(item)


    async def update(self, discount_id: int, payload: DiscountUpdate):
        discount = await self._get_discount_or_404(discount_id)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(discount, field, value)

        await self.db.commit()
        await self.db.refresh(discount)

        return DiscountResponse.model_validate(discount)


    async def delete(self, discount_id: int):
        discount = await self._get_discount_or_404(discount_id)

        stmt = select(Order.order_id).where(Order.discount_id == discount_id).limit(1)
        result = await self.db.execute(stmt)

        if result.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Discount used in orders, cannot delete"
            )

        await self.db.delete(discount)
        await self.db.commit()

        return {"deleted": True}


    async def set_status(self, discount_id: int, is_active: bool):
        discount = await self._get_discount_or_404(discount_id)

        discount.is_active = is_active
        await self.db.commit()
        await self.db.refresh(discount)

        return DiscountResponse.model_validate(discount)


def get_discount_service(db: AsyncSession = Depends(get_db)):
    return AdminDiscountService(db)