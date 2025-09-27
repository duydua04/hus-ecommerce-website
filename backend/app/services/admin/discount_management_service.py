from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, status
from jmespath.ast import field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...middleware.auth import require_admin
from ...schemas.discount import *
from ...models.catalog import Discount

def create_discount(db: Session, payload: DiscountCreate):
    """Ham tao discount moi """
    item = Discount(**payload.model_dump())
    db.add(item)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        # Trả về HTTP 409 Conflict cho truong hop trung code khuyen mai
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Discount code is already exists"
        ) from e
    except Exception as e:
        db.rollback()
        # Trả về HTTP 500 cho lỗi khác
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) from e

    db.refresh(item)

    return DiscountResponse.model_validate(item)

def update_discount(db: Session, discount_id: int, payload: DiscountUpdate):
    """Ham cap nhat lai thong tin discount"""
    discount = (db.query(Discount)
                .filter(Discount.discount_id == discount_id)
    )

    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found"
        )

    updated_data = payload.model_dump(exclude_none=True, exclude_unset=True)

    for field, new_value in updated_data.items():
        if new_value == "string":
            continue

        current_value = getattr(discount, field)
        if current_value != new_value and new_value:
            setattr(discount, field, new_value)

    db.commit()
    db.refresh(discount)

    return DiscountResponse.model_validate(discount)

