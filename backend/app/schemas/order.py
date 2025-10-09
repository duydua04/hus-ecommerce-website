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
    size_id: int | None = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal


from .address import AddressResponse
from typing import List
class SellerOrderDetail(ORMBase):
    """
    DTO chi tiết đơn cho seller: gom gọn OrderResponse + địa chỉ + các item của seller.
    """
    order: OrderResponse
    shipping_address: AddressResponse | None = None
    items: List[OrderItemResponse] = []
    buyer_display_name: str | None = None  # "Hoàng D." (mask nhẹ nếu muốn)
    buyer_phone: str | None = None