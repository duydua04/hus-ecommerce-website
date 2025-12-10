from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc
from sqlalchemy.sql import Select

from ...models.catalog import Category
from ...schemas.category import CategoryResponse
from ...schemas.common import Page, PageMeta


class BaseCategoryService(ABC):
    def __init__(self, db: AsyncSession):
        self.db = db


    async def get(self, category_id: int):
        stmt = select(Category).where(Category.category_id == category_id)
        result = await self.db.execute(stmt)
        cat = result.scalar_one_or_none()

        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        return CategoryResponse.model_validate(cat)

    async def _build_list_response(self, stmt: Select, limit: int, offset: int):
        """
        Hàm xử lý phân trang
        """

        # 1. Đếm tổng số lượng (Count Query)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # 2. Lấy dữ liệu phân trang (Data Query)
        # Thêm order_by, limit, offset vào câu lệnh gốc
        paginated_stmt = stmt.order_by(asc(Category.category_name)).limit(limit).offset(offset)
        result = await self.db.execute(paginated_stmt)
        categories = result.scalars().all()

        # 3. Validate Pydantic
        data = [CategoryResponse.model_validate(c) for c in categories]

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
        """Các lớp con phải override hàm này"""
        pass