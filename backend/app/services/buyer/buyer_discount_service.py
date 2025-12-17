from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..common.discount_service import BaseDiscountService
from ...models.catalog import Discount
from ...schemas.discount import DiscountResponse
from ...config.db import get_db
from fastapi import Depends
from datetime import datetime, date
from ...schemas.common import Page, PageMeta
from sqlalchemy import select, func

class DiscountService(BaseDiscountService):

    async def list(
        self,
        q: Optional[str],
        limit: int = 10,
        offset: int = 0
    ):
        stmt = select(Discount)

        if q and q.strip():
            stmt = stmt.where(
                Discount.name.ilike(f"%{q.strip()}%")
            )

        return await self._build_list_response(
            stmt=stmt,
            limit=limit,
            offset=offset
        )

    async def get_detail(self, discount_id: int):
        discount = await self._get_discount_or_404(discount_id)
        return DiscountResponse.model_validate(discount)
    
    async def list_available(
        self,
        cart_total: int,
        q: str | None,
        limit: int,
        offset: int
    ):
        now = date.today()

        stmt = select(Discount).where(
            Discount.is_active == True,
            Discount.start_date <= now,
            Discount.end_date >= now,
            Discount.min_order_value <= cart_total,
            Discount.usage_limit > Discount.used_count
        )

        if q:
            stmt = stmt.where(Discount.code.ilike(f"%{q}%"))

        # COUNT
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.scalar(count_stmt)

        # ORDER + PAGINATION
        remaining = Discount.usage_limit - Discount.used_count 

        stmt = (
            stmt
            .order_by(
                remaining.asc(),          # sắp hết lượt
                Discount.end_date.asc()   # sắp hết hạn
            )
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        discounts = result.scalars().all()

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
        data=discounts
        )

def get_discount_service(
    db: AsyncSession = Depends(get_db)
):
    return DiscountService(db)