from fastapi import APIRouter, Depends, Query, status, Body
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...middleware.auth import require_admin
from ...schemas.discount import DiscountCreate, DiscountResponse, DiscountUpdate
from ...schemas.common import Page, PageMeta
from ...services.admin.discount_management_service import (
    create_discount, update_discount, list_discounts,
    set_discount_status, delete_discount
)

router = APIRouter(
    prefix="/admin/discounts",
    tags=["admin-discounts"],
    dependencies=[Depends(require_admin)]
)

@router.get("/", response_model=Page)
def admin_list_discount(q: str | None = None, limit: int = 10, offset: int = 0, db: Session = Depends(get_db)):
    return list_discounts(db, q, limit, offset)

@router.post("/",response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def admin_create_discount(payload: DiscountCreate, db: Session = Depends(get_db)):
    """Router tao discount moi"""
    return create_discount(db, payload)

@router.patch("/{discount_id}", response_model=DiscountResponse)
def admin_update_discount(discount_id: int, payload: DiscountUpdate, db: Session = Depends(get_db)):
    """Router cap nhat lai thong tin discount"""
    return update_discount(db, discount_id, payload)

@router.patch("/{discount_id}", response_model=DiscountResponse)
def admin_set_status(discount_id: int,
                     is_active: bool = Body(..., embed=True),
                     db: Session = Depends(get_db)):
    """Router chinh sua trang thai"""
    return set_discount_status(db, discount_id, is_active)

@router.delete("/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_discount(discount_id: int, db: Session = Depends(get_db)):
    """Xoa discount, neu discount da ton tai order thi khong xoa"""
    return delete_discount(db, discount_id)