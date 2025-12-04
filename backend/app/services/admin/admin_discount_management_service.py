from __future__ import annotations
from fastapi import HTTPException, status, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..common.discount_service import BaseDiscountService
from ...config.db import get_db
from ...schemas.discount import DiscountCreate, DiscountResponse, DiscountUpdate
from ...models.catalog import Discount
from ...models.order import Order


class AdminDiscountService(BaseDiscountService):

    def list(self, q: str | None = None, limit: int = 10, offset: int = 0):
        """Admin xem được tất cả """
        query = self.db.query(Discount)
        if q and q.strip():
            query = query.filter(Discount.code.ilike(f"%{q.strip()}%"))

        return self._build_list_response(query, limit, offset)


    def create(self, payload: DiscountCreate):
        item = Discount(**payload.model_dump())
        self.db.add(item)

        try:
            self.db.commit()
            self.db.refresh(item)
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Discount code exists"
            ) from e

        return DiscountResponse.model_validate(item)


    def update(self, discount_id: int, payload: DiscountUpdate):
        discount = self._get_discount_or_404(discount_id)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(discount, field, value)

        self.db.commit()
        self.db.refresh(discount)

        return DiscountResponse.model_validate(discount)


    def delete(self, discount_id: int):
        discount = self._get_discount_or_404(discount_id)
        # Check used in orders
        if self.db.query(Order.order_id).filter(Order.discount_id == discount_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Discount used in orders, cannot delete"
            )

        self.db.delete(discount)
        self.db.commit()

        return {"deleted": True}


    def set_status(self, discount_id: int, is_active: bool):

        discount = self._get_discount_or_404(discount_id)
        discount.is_active = is_active
        self.db.commit()
        self.db.refresh(discount)

        return DiscountResponse.model_validate(discount)


def get_discount_service(db: Session = Depends(get_db)):
    return AdminDiscountService(db)