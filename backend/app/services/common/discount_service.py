from __future__ import annotations

from abc import ABC, abstractmethod
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.sql import Select

from ...schemas.discount import DiscountResponse
from ...schemas.common import Page, PageMeta
from ...models.catalog import Discount


class BaseDiscountService(ABC):

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_discount_or_404(self, discount_id: int):
        """Lấy discount theo ID"""
        stmt = select(Discount).where(Discount.discount_id == discount_id)
        result = await self.db.execute(stmt)
        discount = result.scalar_one_or_none()

        if not discount:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Discount not found"
            )
        return discount


    async def _build_list_response(self, stmt: Select, limit: int, offset: int):
        """
        Hàm phân trang.
        """

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0


        paginated_stmt = stmt.order_by(Discount.end_date.desc()).limit(limit).offset(offset)

        result = await self.db.execute(paginated_stmt)
        discounts = result.scalars().all()

        data = [DiscountResponse.model_validate(d) for d in discounts]

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )


    @abstractmethod
    async def list(self, q: str | None, limit: int, offset: int):
        """Hàm list abstract method (Async)"""
        pass