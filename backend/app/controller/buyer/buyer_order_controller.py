from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, Query as SAQuery
from ...config.db import get_db
from ...services.buyer import buyer_order_service
from ...models.catalog import Product, ProductImage, ProductSize, ProductVariant
from ...services.buyer.buyer_order_service import ApplyDiscountRequest, CheckoutTotalRequest
from pydantic import BaseModel
from decimal import Decimal
from sqlalchemy.orm import selectinload
from datetime import datetime
from ...middleware.auth import require_buyer
from ...models.users import Buyer
router = APIRouter(
    prefix="/buyer/order",
    tags=["buyer_order"]
)


# ==========BƯỚC ÁP MÃ GIẢM GIÁ =============
@router.post("/apply")
def apply_discount(data: ApplyDiscountRequest, db: Session = Depends(get_db)):
    return buyer_order_service.apply_discount_code(db, data.code, data.order_total)

# =============== BƯỚC CHỌN ĐƠN VỊ VẬN CHUYỂN VÀ TÍNH TỔNG TIỀN ==============
@router.post("/select-carrier")
def select_carrier(
    carrier_id: int,
    total_weight: float,
    subtotal: float,
    discount_amount: float = 0,
    db: Session = Depends(get_db)
):
    """
    Khi user chọn DVVC, trả về phí ship và tổng thanh toán
    """
    return buyer_order_service.calculate_total_with_shipping(db, carrier_id, total_weight, subtotal, discount_amount)

# ============= GỘP CÁC BƯỚC TRONG THANH TOÁN ====================
@router.post("/total")
def checkout_total(
    payload: CheckoutTotalRequest,
    db: Session = Depends(get_db),
    buyer_id: int = 1
):
    """
    FE gửi payload JSON:
    {
        "selected_cart_item_ids": [10, 11, 13],
        "discount_code": "ABC123",
        "carrier_id": 1
    }
    """
    return buyer_order_service.checkout_total(
        db=db,
        buyer_id=buyer_id,
        selected_cart_item_ids=payload.selected_cart_item_ids,
        discount_code=payload.discount_code,
        carrier_id=payload.carrier_id
    )
