from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, Query as SAQuery
from pydantic import BaseModel
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
class ValidateDiscountRequest(BaseModel):
    code: str
    cart_total: int

class ValidateDiscountResponse(BaseModel):
    valid: bool
    discount_amount: int = 0
    final_total: int
    message: str
class DiscountPreviewRequest(BaseModel):
    discount_id: int
    cart_total: int

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

# =============== ĐƯA RA CÁC MÃ GIẢM GIÁ CÓ THỂ ÁP DỤNG CHO ĐƠN HÀNG ==================
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
 # ================================== GỢI Ý MÃ GIẢM GIÁ TỐT NHẤT =======================
@router.get("/best")
async def get_best_discount(
    cart_total: int = Query(..., gt=0),
    service: DiscountService = Depends(get_discount_service)
):
    return await service.get_best_discount(cart_total)

# =============== KIỂM TRA MÃ GIẢM GIÁ NGƯỜI DÙNG NHẬP CÓ ÁP DỤNG ĐƯỢC KHÔNG ==============
@router.post("/validate", response_model=ValidateDiscountResponse)
async def validate_discount(
    payload: ValidateDiscountRequest,
    service: DiscountService = Depends(get_discount_service)
):
    return await service.validate_simple(
        code=payload.code,
        cart_total=payload.cart_total
    )

# =================== PREVIEW ÁP DỤNG VOUCHER (DÙNG CHO USER KÍCH VÔ VOUCHER ĐÓ) ==================
@router.post("/preview")
async def preview_discount(
    payload: DiscountPreviewRequest,
    service: DiscountService = Depends(get_discount_service)
):
    return await service.preview_discount(
        discount_id=payload.discount_id,
        cart_total=payload.cart_total
    )

# ============== ĐƯA RA THÔNG TIN CHI TIẾT MÃ GIẢM GIÁ ===============
@router.get("/{discount_id}", response_model=DiscountResponse)
async def get_discount_detail(
    discount_id: int,
    service: DiscountService = Depends(get_discount_service)
):
    return await service.get_detail(discount_id)


