from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...middleware.auth import require_admin
from ...schemas.discount import DiscountCreate, DiscountResponse, DiscountUpdate
from ...services.admin.discount_management_service import create_discount, update_discount

router = APIRouter(
    prefix="/admin/discounts",
    tags=["admin-discounts"],
    dependencies=[Depends(require_admin)]
)

@router.post("/",response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def admin_create_discount(payload: DiscountCreate, db: Session = Depends(get_db)):
    """Router tao discount moi"""
    return create_discount(db, payload)

@router.patch("/{discount_id}", response_model=DiscountResponse)
def admin_update_discount(discount_id: int, payload: DiscountUpdate, db: Session = Depends(get_db)):
    """Router update discount"""
    return update_discount(db, discount_id, payload)

