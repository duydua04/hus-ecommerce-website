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
from ...schemas.discount import DiscountResponse
from ...schemas.common import Page
from ...services.buyer.buyer_discount_service import (
    DiscountService,
    get_discount_service
)
router = APIRouter(
    prefix="/buyer/order",
    tags=["buyer_order"]
)

# ================ ĐƯA RA DANH SÁCH MÃ GIẢM GIÁ ==========
@router.get("/", response_model=Page)
async def list_discounts(
    q: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: DiscountService = Depends(get_discount_service)
):
    return await service.get_list(
        q=q,
        limit=limit,
        offset=offset
    )

# ============== ĐƯA RA THÔNG TIN CHI TIẾT MÃ GIẢM GIÁ ===============
@router.get("/{discount_id}", response_model=DiscountResponse)
async def get_discount_detail(
    discount_id: int,
    service: DiscountService = Depends(get_discount_service)
):
    return await service.get_detail(discount_id)


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
