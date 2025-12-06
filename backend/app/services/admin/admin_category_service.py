from __future__ import annotations

from fastapi import HTTPException, status, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..common.category_service import BaseCategoryService
from ...config.db import get_db
from ...models.catalog import Category, Product
from ...schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse


class AdminCategoryService(BaseCategoryService):

    def list(self, q: str | None = None, limit: int = 10, offset: int = 0):
        # Ham admin list giống Category
        query = self.db.query(Category)
        if q and q.strip():
            query = query.filter(Category.category_name.ilike(f"%{q.strip()}%"))

        return self._build_list_response(query, limit, offset)


    def create(self, payload: CategoryCreate):
        name = payload.category_name.strip()
        if not name: raise HTTPException(422, "Name required")

        if self.db.query(Category).filter(func.lower(Category.category_name) == name.lower()).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category exists"
            )

        cat = Category(category_name=name)
        self.db.add(cat)
        self.db.commit()
        self.db.refresh(cat)

        return CategoryResponse.model_validate(cat)


    def update(self, category_id: int, payload: CategoryUpdate):
        # Gọi hàm get của cha để tìm và check 404
        cat = self.db.query(Category).get(category_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        if payload.category_name:
            name = payload.category_name.strip()
            dup = self.db.query(Category).filter(
                func.lower(Category.category_name) == name.lower(),
                Category.category_id != category_id
            ).first()
            if dup:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Name exists"
                )

            cat.category_name = name

        self.db.commit()
        self.db.refresh(cat)

        return CategoryResponse.model_validate(cat)


    def delete(self, category_id: int):
        """Ham xoa category"""
        cat = self.db.query(Category).get(category_id)
        if not cat: raise HTTPException(404, "Not found")

        if self.db.query(Product.product_id).filter(Product.category_id == category_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category has products"
            )


        self.db.delete(cat)
        self.db.commit()

        return {"deleted": True, "category_id": category_id}


def get_admin_category_service(db: Session = Depends(get_db)):
    return AdminCategoryService(db)