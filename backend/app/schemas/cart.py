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
