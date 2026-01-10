# app/schemas/order.py
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field
from .common import ORMBase, PaymentMethod, OrderStatus, PaymentStatus

# (Request) — tạo đơn từ cart
class OrderCreate(BaseModel):
    buyer_id: int
    buyer_address_id: int
    payment_method: PaymentMethod
    discount_id: int | None = None
    carrier_id: int
    notes: str | None = None

# (Request) — cập nhật trạng thái/thanh toán (admin/seller workflow)
class OrderUpdateStatus(BaseModel):
    order_status: OrderStatus | None = None
    payment_status: PaymentStatus | None = None
    delivery_date: datetime | None = None
    notes: str | None = None

# (Response)
class OrderResponse(ORMBase):
    order_id: int
    buyer_id: int
    buyer_address_id: int
    payment_method: PaymentMethod
    subtotal: Decimal
    shipping_price: Decimal
    discount_amount: Decimal
    total_price: Decimal
    order_date: datetime | None = None
    delivery_date: datetime | None = None
    order_status: OrderStatus
    payment_status: PaymentStatus
    discount_id: int | None = None
    carrier_id: int
    notes: str | None = None

# (Response) — chi tiết từng dòng hàng trong đơn
class OrderItemResponse(ORMBase):
    order_item_id: int
    order_id: int
    product_id: int
    variant_id: int | None = None
    variant_name: str | None = None
    size_id: int | None = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    product_name: Optional[str] = None
    product_image: Optional[str] = None
    size_name: Optional[str] = None

    # -------------------------

    class Config:
        from_attributes = True


from .address import AddressResponse
from typing import List, Optional
class SellerOrderDetail(ORMBase):
    """
    DTO chi tiết đơn cho seller: gom gọn OrderResponse + địa chỉ + các item của seller.
    """
    order: OrderResponse
    shipping_address: AddressResponse | None = None
    items: List[OrderItemResponse] = []
    buyer_display_name: str | None = None  # "Hoàng D." (mask nhẹ nếu muốn)
    buyer_phone: str | None = None
    carrier_name: str | None = None
    carrier_avt_url: str | None = None

class OrderCreateNew(BaseModel):
    buyer_address_id: int
    carrier_id: int
    payment_method: str
    discount_id: Optional[int] = None
    notes: Optional[str] = None
    cart_item_ids: List[int]  # danh sách sản phẩm muốn mua

from .carrier import CarrierResponse
class OrderDetailResponse(BaseModel):
    order: OrderResponse               # dữ liệu order
    shipping_address: AddressResponse
    items: List[OrderItemResponseNew]
    carrier: CarrierResponse
    # discount_id: Optional[int] = None
    # discount_amount: Optional[Decimal] = None
    # subtotal: Decimal
    # total_price: Decimal

class OrderTrackingFirstItem(BaseModel):
    product_id: int
    product_name: str
    public_url: str | None

    variant_name: str | None
    size_name: str | None

    quantity: int
    unit_price: Decimal

class BuyerOrderTrackingItem(BaseModel):
    order_id: int
    order_status: str

    shop_name: str
    shop_url: str|None
    first_item: OrderTrackingFirstItem
    total_items: int

    subtotal: Decimal
    total_price: Decimal

    order_date: datetime

class OrderItemResponseNew(BaseModel):
    order_item_id: int
    order_id: int
    product_id: int
    product_id_name: str
    variant_id: int | None = None
    variant_name: str 
    size_id: int | None = None
    size_name: str 
    quantity: int
    unit_price: Decimal             # giá sale lúc đặt
    # total_price: Decimal            # unit_price * quantity
    base_price_plus_adjustment: Decimal
    # price_after_discount: Decimal
    # weight: Decimal
    # total_weight: Decimal
    public_image_url: str | None = None
    seller: str