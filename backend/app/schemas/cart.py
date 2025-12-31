# app/schemas/cart.py
from __future__ import annotations
from pydantic import BaseModel, Field
from decimal import Decimal
from .common import ORMBase

# Response gio hang
class ShoppingCartResponse(ORMBase):
    shopping_cart_id: int
    buyer_id: int

# Request tao san pham trong gio hang
class ShoppingCartItemCreate(BaseModel):
    shopping_cart_id: int
    product_id: int
    variant_id: int | None = None
    size_id: int | None = None
    quantity: int = Field(1, ge=1)

# Request update san pham trong gio hang, phai lon hon hoac bang 1
class ShoppingCartItemUpdate(BaseModel):
    quantity: int | None = Field(None, ge=1)

# Response san pham
class ShoppingCartItemResponse(ORMBase):
    shopping_cart_item_id: int
    shopping_cart_id: int
    product_id: int
    variant_id: int | None = None
    size_id: int | None = None
    quantity: int

from typing import List, Optional
class CartProduct(BaseModel):
    product_id: int
    name: str
    variant_id: Optional[int]
    variant_name: Optional[str]
    size_id: Optional[int]
    size_name: Optional[str]
    quantity: int
    price: float
    public_image_url: Optional[str]

class SellerCart(BaseModel):
    seller: str
    products: List[CartProduct]

class CartItemKey(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    size_id: Optional[int] = None

class CartSummaryRequest(BaseModel):
    selected_items: List[CartItemKey]  # danh sách sản phẩm trong cart