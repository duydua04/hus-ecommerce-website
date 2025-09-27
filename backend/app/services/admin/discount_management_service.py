from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...middleware.auth import require_admin
from ...schemas.discount import *
from ...models.catalog import Discount

def create_discount(db: Session, payload: DiscountCreate):
    item = Discount(**payload.model_dump())
    db.add(item)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        # Trả về HTTP 409 Conflict cho truong hop trung code khuyen mai
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Discount code already exists"
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


