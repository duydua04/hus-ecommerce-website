from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel


from ...middleware.auth import require_buyer
from ...services.buyer.buyer_cart_service import CartServiceAsync,  get_cart_service
from ...schemas.product import AddToCartRequest, UpdateCartItemRequest, UpdateVariantSizeRequest
from ...schemas.cart import SellerCart, CartSummaryRequest
from ...models.users import Buyer
from ...schemas.common import Page

router = APIRouter(
    prefix="/buyer/cart",
    tags=["buyer_cart"]
)


# ===================== THÊM SẢN PHẨM VÀO GIỎ HÀNG (REDIS) =====================
@router.post("/add", response_model=dict)
async def add_to_cart(
    payload: AddToCartRequest,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Thêm sản phẩm vào giỏ hàng (Redis)
    """

    item = await service.add_to_cart(
        buyer_id=buyer["user"].buyer_id,
        product_id=payload.product_id,
        variant_id=payload.variant_id,
        size_id=payload.size_id,
        quantity=payload.quantity
    )

    total_items = await service.count_items(buyer["user"].buyer_id)

    return {
        "message": f"✅ Thêm {payload.quantity} sản phẩm vào giỏ hàng thành công",
        "item": item,
        "total_items": total_items
    }
# ===================== HIỂN THỊ GIỎ HÀNG =====================
@router.get("/show")
async def get_buyer_cart(
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Lấy giỏ hàng của buyer từ Redis
    """
    return await service.get_buyer_cart(
        buyer_id=buyer["user"].buyer_id
    )
# # ===================== ROUTER =======================
# @router.get("/cart/search")
# async def search_cart_items(
#     q: str = Query(..., min_length=1),
#     limit: int = Query(10, ge=1, le=20),
#     service: CartServiceAsync = Depends(get_cart_service),
#     buyer: dict = Depends(require_buyer)
# ):
#     """
#     Search sản phẩm trong giỏ hàng (Redis + DB lookup)
#     """
#     data = await service.search_buyer_cart_items(
#         buyer_id=buyer["user"].buyer_id,
#         q=q,
#         limit=limit,
#     )
#     return {"data": data}
# ===================== XÓA SẢN PHẨM KHỎI GIỎ HÀNG =====================
@router.delete("/product", response_model=dict)
async def delete_item(
    product_id: int = Query(...),
    variant_id: int | None = Query(None),
    size_id: int | None = Query(None),
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    return await service.delete_item(
        buyer["user"].buyer_id,
        product_id,
        variant_id,
        size_id
    )


# ===================== TÍNH TỔNG TIỀN GIỎ HÀNG =====================

@router.post("/summary", response_model=dict)
async def cart_summary(
    request: CartSummaryRequest,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Tính tổng tiền các sản phẩm trong giỏ hàng dựa trên danh sách selected_items (product_id, variant_id, size_id)
    """
    return await service.cart_total(
        buyer_id=buyer["user"].buyer_id,
        selected_items=request.selected_items
    )
# ===================== CẬP NHẬT SỐ LƯỢNG SẢN PHẨM =====================
@router.patch("/item/quantity")
async def update_cart_quantity_item(
    request: UpdateCartItemRequest,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Cập nhật số lượng sản phẩm trong giỏ hàng (Redis).

    FE cần gửi JSON body gồm:
    - product_id: int                -> ID sản phẩm
    - variant_id: int (optional)    -> ID biến thể, nếu sản phẩm có variant
    - size_id: int (optional)       -> ID size, nếu sản phẩm có size
    - action: str (optional)        -> "increase" hoặc "decrease" để tăng/giảm số lượng
    - quantity: int (optional)      -> set số lượng trực tiếp (nếu muốn set cụ thể)
    """
    return await service.update_quantity(buyer["user"].buyer_id, request)


# ===================== CẬP NHẬT VARIANT + SIZE =====================
@router.patch("/item/variant-size", response_model=dict)
async def update_cart_item_variant_size(
    request: UpdateVariantSizeRequest,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Cập nhật variant và size của sản phẩm trong giỏ hàng (Redis).
    """
    return await service.update_variant_size(buyer["user"].buyer_id, request)

