from __future__ import annotations
from abc import ABC
from redis.asyncio import Redis

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc
from sqlalchemy.sql import Select

from ...config import public_url
from ...models.catalog import Category
from ...schemas.category import CategoryResponse
from ...schemas.common import Page, PageMeta


class BaseCategoryService(ABC):
    def __init__(self, db: AsyncSession, redis: Redis = None):
        self.db = db
        self.redis = redis
        self.CACHE_KEY_ALL = "categories:list:all"

    @staticmethod
    def _map_to_response(category: Category) -> CategoryResponse:
        """
        Chuyển DB Model -> Pydantic Schema
        và xử lý logic convert image_key -> image_url
        """

        resp = CategoryResponse.model_validate(category)
        resp.image_url = public_url(category.image_url)

        return resp

    async def get(self, category_id: int):
        stmt = select(Category).where(Category.category_id == category_id)
        result = await self.db.execute(stmt)
        cat = result.scalar_one_or_none()

        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        return self._map_to_response(cat)


    async def _build_list_response(self, stmt: Select, limit: int, offset: int):
        """
        Hàm xử lý phân trang
        """

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        paginated_stmt = stmt.order_by(asc(Category.category_name)).limit(limit).offset(offset)
        result = await self.db.execute(paginated_stmt)
        categories = result.scalars().all()

        data = [self._map_to_response(c) for c in categories]

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )

    async def _invalidate_list_cache(self):
        """Xóa cache danh sách khi dữ liệu thay đổi"""
        if self.redis:
            await self.redis.delete(self.CACHE_KEY_ALL)