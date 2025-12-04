from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from abc import ABC, abstractmethod
from ...schemas.discount import DiscountResponse
from ...schemas.common import Page, PageMeta
from ...models.catalog import Discount

class BaseDiscountService(ABC):
    def __init__(self, db: Session):
        self.db = db

    def _get_discount_or_404(self, discount_id: int):
        discount = self.db.query(Discount).filter(Discount.discount_id == discount_id).first()
        if not discount:
            raise HTTPException(status_code=404, detail="Discount not found")
        return discount

    @staticmethod
    def _build_list_response(query, limit: int, offset: int):
        total = query.count()
        discounts = query.order_by(Discount.end_date.desc())\
                         .limit(limit).offset(offset).all()
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
    def list(self, q: str | None, limit: int, offset: int):
        """Hàm list abstract method"""
        pass