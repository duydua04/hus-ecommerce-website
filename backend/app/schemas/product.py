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
    sold_quantity: int
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

from typing import Optional
class UpdateCartItemRequest(BaseModel):
    quantity: int | None = None
    action: str | None = None  # "increase"

class UpdateVariantSizeRequest(BaseModel):
    new_variant_id: Optional[int] = None
    new_size_id: Optional[int] = None

class AddToCartRequest(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    size_id: Optional[int] = None
    quantity: int = 1

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

class ProductResponseBuyer(ORMBase):
    product_id: int
    name: str
    base_price: Decimal
    discount_percent: Decimal
    rating: float
    review_count: int
    sold_quantity: int
    description: Optional[str]
    weight: Optional[Decimal]
    public_image_url: Optional[str]

class ProductVariantLiteResponse(ORMBase):
    variant_id: int
    variant_name: str

from datetime import datetime
class ProductResponseBuyer(TimestampedOut):
    product_id: int
    created_at: datetime | None 
    name: str
    seller_id: int

    discount_percent: Decimal

    sale_price: Decimal  

    rating: float
    review_count: int
    sold_quantity: int
    category_id: int | None = None
    description: str | None = None
    is_active: bool

class ProductPriceRequest(BaseModel):
    product_id: int
    variant_id: int | None = None  # Nếu không chọn variant thì dùng base price
    size_id: int | None = None     # Chọn size (thường không ảnh hưởng price)

class ProductPriceResponse(ORMBase):
    product_id: int
    variant_id: int | None
    size_id: int | None
    base_price: float
    price_adjustment: float | None
    discount_percent: float
    sale_price: float

class ShopInfoResponse(BaseModel):
    seller_id: int
    shop_name: str
    avt_url: str | None
    average_rating: float
    rating_count: int