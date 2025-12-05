from __future__ import annotations
from abc import ABC, abstractmethod

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...models.catalog import Category
from ...schemas.category import CategoryResponse
from ...schemas.common import Page, PageMeta


class BaseCategoryService(ABC):
    def __init__(self, db: Session):
        self.db = db

    # --- Common Logic ---
    def get(self, category_id: int):
        cat = (self.db.query(Category)
               .filter(Category.category_id == category_id)
               .first()
        )

        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        return CategoryResponse.model_validate(cat)


    @staticmethod
    def _build_list_response(query, limit: int, offset: int):
        total = query.count()
        categories = query.order_by(Category.category_name.asc())\
                          .limit(limit).offset(offset).all()
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
    def list(self, q: str | None, limit: int, offset: int):
        pass