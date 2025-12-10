from __future__ import annotations

from fastapi import HTTPException, status, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..common.category_service import BaseCategoryService
from ...config.db import get_db
from ...models.catalog import Category, Product
from ...schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse


class AdminCategoryService(BaseCategoryService):

    def __init__(self, db: AsyncSession):
        super().__init__(db)


    async def list(self, q: str | None = None, limit: int = 10, offset: int = 0):
        stmt = select(Category)

        if q and q.strip():
            stmt = stmt.where(Category.category_name.ilike(f"%{q.strip()}%"))

        return await self._build_list_response(stmt, limit, offset)


    async def create(self, payload: CategoryCreate):
        name = payload.category_name.strip()
        if not name:
            raise HTTPException(422, "Name required")

        stmt = select(Category).where(
            func.lower(Category.category_name) == name.lower()
        )
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category exists"
            )

        cat = Category(category_name=name)

        self.db.add(cat)
        await self.db.commit()
        await self.db.refresh(cat)

        return CategoryResponse.model_validate(cat)


    async def update(self, category_id: int, payload: CategoryUpdate):
        """Ham update category"""
        # Tìm Category theo ID (Async get)
        cat = await self.db.get(Category, category_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        # Update logic
        if payload.category_name:
            name = payload.category_name.strip()

            # Check trùng tên
            stmt = select(Category).where(
                func.lower(Category.category_name) == name.lower(),
                Category.category_id != category_id
            )
            result = await self.db.execute(stmt)

            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Name exists"
                )

            cat.category_name = name

        await self.db.commit()
        await self.db.refresh(cat)

        return CategoryResponse.model_validate(cat)

    async def delete(self, category_id: int):
        """Ham xoa category"""

        cat = await self.db.get(Category, category_id)
        if not cat:
            raise HTTPException(404, "Not found")

        # Check xem có Product nào thuộc Category này không
        stmt = select(Product.product_id).where(Product.category_id == category_id).limit(1)
        result = await self.db.execute(stmt)

        if result.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category has products"
            )

        await self.db.delete(cat)
        await self.db.commit()

        return {"deleted": True, "category_id": category_id}


def get_admin_category_service(db: AsyncSession = Depends(get_db)):
    return AdminCategoryService(db)