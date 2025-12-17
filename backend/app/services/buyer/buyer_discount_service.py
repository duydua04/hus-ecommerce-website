from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..common.discount_service import BaseDiscountService
from ...models.catalog import Discount
from ...schemas.discount import DiscountResponse
from ...config.db import get_db
from fastapi import HTTPException, status, Depends


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


def get_discount_service(
    db: AsyncSession = Depends(get_db)
):
    return DiscountService(db)