from __future__ import annotations
from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field
from .common import ORMBase, TimestampedOut

# Request tao san pham
class ProductCreate(BaseModel):
    name: str
    seller_id: int
    base_price: Decimal = Field(..., ge=0)
    category_id: int | None = None
    description: str | None = None
    discount_percent: Decimal | None = Field(0, ge=0, le=100)
    weight: Decimal | None = Field(None, ge=0)
    is_active: bool | None = None

# Request cap nhat san pham
class ProductUpdate(BaseModel):
    name: str | None = None
    base_price: Decimal | None = Field(None, ge=0)
    category_id: int | None = None
    description: str | None = None
    discount_percent: Decimal | None = Field(None, ge=0, le=100)
    weight: Decimal | None = Field(None, ge=0)
    is_active: bool | None = None

# Response tra lai thong tin san pham
class ProductResponse(TimestampedOut):
    product_id: int
    name: str
    seller_id: int
    base_price: Decimal
    rating: float
    review_count: int
    category_id: int | None = None
    description: str | None = None
    discount_percent: Decimal
    weight: Decimal | None = None
    is_active: bool

class ProductList(ProductResponse):
    category_name: str | None = None
    public_primary_image_url: str | None = None

class ProductDetail(BaseModel):
    product_id: int
    name: str
    base_price: Decimal
    category_id: int | None = None
    category_name: str | None = None
    description: str | None = None
    discount_percent: Decimal
    weight: Decimal | None = None
    is_active: bool
    created_at: str | None = None

    images: List[ProductImageResponse]
    variants: List[ProductVariantWithSizesResponse]


# ===== Variant =====
# (Request)
class ProductVariantCreate(BaseModel):
    product_id: int
    variant_name: str
    price_adjustment: Decimal | None = Field(0, ge=0)

# (Request)
class ProductVariantUpdate(BaseModel):
    variant_name: str | None = None
    price_adjustment: Decimal | None = Field(None, ge=0)

# (Response)
class ProductVariantResponse(ORMBase):
    variant_id: int
    product_id: int
    variant_name: str
    price_adjustment: Decimal

# Request tao product size
class ProductSizeCreate(BaseModel):
    variant_id: int
    size_name: str = Field(..., max_length=20)
    available_units: int | None = Field(0, ge=0)
    in_stock: bool | None = None

# Request update size
class ProductSizeUpdate(BaseModel):
    size_name: str | None = Field(None, max_length=20)
    available_units: int | None = Field(None, ge=0)
    in_stock: bool | None = None

# Response thong tin ve product size
class ProductSizeResponse(ORMBase):
    size_id: int
    variant_id: int
    size_name: str
    available_units: int
    in_stock: bool

# (Request) — confirm sau khi FE PUT ảnh vào MinIO; gửi object_key
class ProductImageCreate(BaseModel):
    product_id: int
    image_url: str        # object_key trong bucket
    is_primary: bool | None = None

# (Response)
class ProductImageResponse(ORMBase):
    product_image_id: int
    product_id: int
    image_url: str
    public_image_url: str
    is_primary: bool

class ProductVariantWithSizesResponse(ProductVariantResponse):
    sizes: List[ProductSizeResponse] = []
