from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, Query as SAQuery
from ...middleware.auth import require_buyer
from ...schemas.discount import DiscountResponse
from ...schemas.common import Page
from ...middleware.auth import require_buyer
from ...services.buyer.buyer_discount_service import (
    DiscountService,
    get_discount_service
)
router = APIRouter(
    prefix="/buyer/discount",
    tags=["buyer_discount"],
    # dependencies=[Depends(require_buyer)]
)

# ================ ĐƯA RA DANH SÁCH MÃ GIẢM GIÁ ==========
@router.get("/", response_model=Page)
async def buyer_list_discounts(
    q: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: DiscountService = Depends(get_discount_service)
):
    return await service.list(
        q=q,
        limit=limit,
        offset=offset
    )

# =============== LẤY DANH SÁCH VOUCHER CÓ THỂ ÁP DỤNG ĐƯỢC ==================
@router.get("/available", response_model=Page)
async def get_available_discounts(
    cart_total: int = Query(..., gt=0, description="Tổng tiền giỏ hàng"),
    q: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: DiscountService = Depends(get_discount_service)
):
    return await service.list_available(
        cart_total=cart_total,
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

