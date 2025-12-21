from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from ...middleware.auth import require_buyer
from ...services.buyer.buyer_cart_service import CartServiceAsync,  get_cart_service
from ...schemas.product import AddToCartRequest, UpdateCartItemRequest, UpdateVariantSizeRequest
from ...schemas.cart import SellerCart, CartSummaryRequest
from ...models.users import Buyer

router = APIRouter(
    prefix="/buyer/cart",
    tags=["buyer_cart"]
)


# ===================== THÊM SẢN PHẨM VÀO GIỎ HÀNG =====================
@router.post("/add", response_model=dict)
async def add_to_cart(
    payload: AddToCartRequest,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Thêm sản phẩm vào giỏ hàng
    """
    # Thêm sản phẩm
    cart = await service.add_to_cart(
        buyer_id=buyer["user"].buyer_id,
        product_id=payload.product_id,
        variant_id=payload.variant_id,
        size_id=payload.size_id,
        quantity=payload.quantity
    )

    # Preload items để tính tổng
    await service.db.refresh(cart, attribute_names=["items"])
    total_items = sum(item.quantity for item in cart.items)

    return {
        "message": f"✅ Thêm {payload.quantity} sản phẩm vào giỏ hàng thành công",
        "cart_id": cart.shopping_cart_id,
        "total_items": total_items
    }

# ===================== HIỂN THỊ GIỎ HÀNG =====================
@router.get("/show", response_model=List[SellerCart])
async def get_buyer_cart(
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Lấy toàn bộ giỏ hàng của người dùng.
    - Trả về danh sách sản phẩm, variant, size, số lượng, giá, hình ảnh.
    - Nhóm theo seller/shop.
    """
    return await service.get_buyer_cart(buyer["user"].buyer_id)

# ===================== XÓA SẢN PHẨM KHỎI GIỎ HÀNG =====================
# ===================== XÓA SẢN PHẨM KHỎI GIỎ HÀNG =====================
@router.delete("/product/{item_id}", response_model=dict)
async def delete_item(
    item_id: int,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Xóa 1 item khỏi giỏ hàng của người dùng.
    - item_id là `shopping_cart_item_id` trong DB.
    """
    return await service.delete_item(buyer["user"].buyer_id, item_id)


# ===================== TÍNH TỔNG TIỀN GIỎ HÀNG =====================

@router.post("/summary", response_model=dict)
async def cart_summary(
    request: CartSummaryRequest,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Tính tổng tiền các sản phẩm trong giỏ hàng dựa trên danh sách item_id.
    - Trả về subtotal và tổng số lượng item.
    """
    return await service.cart_total(buyer["user"].buyer_id, request.selected_item_ids)


# ===================== CẬP NHẬT SỐ LƯỢNG SẢN PHẨM =====================
@router.patch("/item/quantity/{item_id}")
async def update_cart_quantity_item(
    item_id: int,
    request: UpdateCartItemRequest,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Cập nhật số lượng sản phẩm trong giỏ hàng.
    """
    return await service.update_quantity(buyer["user"].buyer_id, item_id, request)


# ===================== CẬP NHẬT VARIANT + SIZE =====================
@router.patch("/item/variant-size/{item_id}")
async def update_cart_item_variant_size(
    item_id: int,
    request: UpdateVariantSizeRequest,
    service: CartServiceAsync = Depends(get_cart_service),
    buyer: dict = Depends(require_buyer)
):
    """
    Cập nhật variant và size của sản phẩm trong giỏ hàng.
    - Kiểm tra tồn kho, hợp lệ với product.
    - Nếu trùng item, merge số lượng.
    """
    return await service.update_variant_size(buyer["user"].buyer_id, item_id, request)

