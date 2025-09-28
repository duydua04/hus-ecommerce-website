from __future__ import annotations

from dateutil.utils import today
from fastapi import Depends, HTTPException, Query, status
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...middleware.auth import require_admin
from ...schemas.discount import *
from ...schemas.common import Page, PageMeta
from ...models.catalog import Discount
from ...models.order import Order

def discount_used_in_orders(db: Session, discount_id: int):
    """Kiem tra xem ma giam gia da duoc dung o don hang nao chua"""
    return (db.query(Order.order_id)
            .filter(Order.discount_id == discount_id)
    ).first() is not None

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
        current_value = getattr(discount, field)
        if current_value != new_value and new_value:
            setattr(discount, field, new_value)

    db.commit()
    db.refresh(discount)

    return DiscountResponse.model_validate(discount)

def delete_discount(db: Session, discount_id: int):
    this_discount = (db.query(Discount.discount_id)
                     .filter(Discount.discount_id == discount_id)
                     .first()
                     )
    # Neu khong co discount tra ve khong tim thay
    if not this_discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found"
        )

    # Neu discount da duoc dung trong don hang thi khong duoc xoa
    if discount_used_in_orders(db, discount_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount has been used in orders. Please deactivate instead."
        )

    # Thuc hien xoa neu chua dung trong bat cu don hang nao
    db.delete(this_discount)
    db.commit()

    return {"deleted": True, "discount_id": discount_id}

def set_discount_status(db: Session, discount_id: int, is_active: bool):
    """Chuyen trang thai activce cua discount"""
    this_discount = db.query(Discount.discount_id).filter(Discount.discount_id == discount_id)
    if not this_discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount_not_found"
        )

    this_discount.is_active = bool(is_active)
    db.commit()
    db.refresh(this_discount)

    return DiscountResponse.model_validate(this_discount)

def auto_expired_discount(db: Session):
    """
    Tu dong set trang thai ve False cho discount da qua han
    """
    today = date.today()
    update_active = (update(Discount)
                     .where(Discount.is_active.is_(True), Discount.end_date < today)
                     .values(is_active=True)
    )

    res = db.execute(update_active)
    db.commit()

    # Tra ve so ban ghi duoc cap nhat
    return res.rowcount or 0

def list_discounts(db: Session, q: str | None =None, limit: int = 10, offset: int = 0):
    """Ham list danh sach discount, tuy chon tim theo code"""

    query = db.query(Discount)

    if q and q.strip():
        query = query.filter(Discount.code.ilike(f"%{q.strip()}%"))

    total = query.count()

    discounts = query.order_by(Discount.discount_id.desc()) \
                 .limit(limit) \
                 .offset(offset)

    data = [DiscountResponse.model_validate(disc) for disc in discounts]

    return Page(
        meta=PageMeta(total=total, limit=limit, offset=offset),
        data=data
    )