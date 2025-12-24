from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal

from .common import OrderStatus, PaymentStatus, PaymentMethod
from .order import OrderItemResponse
from .address import AddressResponse


# --- INPUT ---
class SellerOrderFilter(BaseModel):
    status: Optional[OrderStatus] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    limit: int = 20


class SellerCancelReason(BaseModel):
    reason: str


# --- OUTPUT ---
class BuyerInfoShort(BaseModel):
    buyer_id: int
    full_name: str
    phone: str
    avt_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SellerOrderListItem(BaseModel):
    order_id: int
    order_date: datetime
    order_status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    total_price: Decimal
    buyer_name: str
    item_count: int
    model_config = ConfigDict(from_attributes=True)


class SellerOrderDetailResponse(BaseModel):
    order_id: int
    order_date: datetime
    delivery_date: Optional[datetime] = None
    order_status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    subtotal: Decimal
    shipping_price: Decimal
    discount_amount: Decimal
    total_price: Decimal
    notes: Optional[str] = None
    carrier_name: str

    buyer_info: BuyerInfoShort
    shipping_address_detail: AddressResponse
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)