from __future__ import annotations
from typing import Optional

from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ...config.db import get_db
from ...models.catalog import Discount
from ...schemas.common import Page, PageMeta
from ...schemas.discount import DiscountResponse

class DiscountService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_list(
        self,
        q: Optional[str],
        limit: int = 10,
        offset: int = 0
    ):
        stmt = select(Discount)

        if q and q.strip():
            stmt = stmt.where(Discount.name.ilike(f"%{q.strip()}%"))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            stmt
            .order_by(Discount.end_date.desc())
            .limit(limit)
            .offset(offset)
        )

        res = self.db.execute(stmt)
        discounts = res.scalars().all()

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=[DiscountResponse.model_validate(d) for d in discounts]
        )

    async def get_detail(self, discount_id: int):
        stmt = select(Discount).where(Discount.discount_id == discount_id)
        res = self.db.execute(stmt)
        discount = res.scalar_one_or_none()

        if not discount:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Discount not found"
            )

        return DiscountResponse.model_validate(discount)

def get_discount_service(
    db: AsyncSession = Depends(get_db)
):
    return DiscountService(db)