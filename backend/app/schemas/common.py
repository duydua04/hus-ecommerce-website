from __future__ import annotations
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, ConfigDict

# Tạo các enum phù hợp với các Enum đã có trong cơ sở dữ liệu và model

# Enum về thứ hạng người mua bao gồm từ đồng đến kim cương
class BuyerTier(str, Enum):
    bronze = "bronze"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"
    diamond = "diamond"

# Enum về thứ hạng người bán bao gồm từ shop thường đến shop mall
class SellerTier(str, Enum):
    regular = "regular"
    preferred = "preferred"
    mall = "mall"

class BuyerAddressLabel(str, Enum):
    """
    Loại địa chỉ của người mua bao gồm
    home: nhà riêng
    office: văn phòng, nơi làm việc
    other: Loại địa chỉ khác
    """
    home = "home"
    office = "office"
    other = "other"

class SellerAddressLabel(str, Enum):
    """
    Địa chỉ người bán bao gồm
    headquarter: Trụ sở chính
    warehouse: Kho hàng
    other: Loại địa chỉ khác
    """
    headquarters = "headquarters"
    warehouse = "warehouse"
    other = "other"

class PaymentMethod(str, Enum):
    """
    Các phương thức thanh toán bao gồm
    bank_transfer: Chuyển khoản ngân hàng
    cod: Thanh toán bằng tiền mặt
    mim_pay: ví điện tử mim pay
    """
    bank_transfer = "bank_transfer"
    cod = "cod"
    mim_pay = "mim_pay"

class OrderStatus(str, Enum):
    """
    Các trạng thái của đơn hàng bao gồm
    pending: Đang chờ xác nhận
    processing: Đang chuẩn bị hàng
    shipped: Đơn hàng đã giao cho đơn vị vận chuyển
    delivered: Đơn hàng đã được giao thành công
    cancelled: Đã hủy
    returned: Đơn trả hàng
    """
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    returned = "returned"

class PaymentStatus(str, Enum):
    """
    Các trạng thái thanh toán bao gồm
    pending: Chờ thanh toán
    paid: Đã thanh toán thành công
    failed: Thanh toán thất bại
    refunded: Đã hoàn tiền
    """
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"

class ORMBase(BaseModel):
    """Bật chế độ ORM → có thể .from_orm() (Pydantic v2: from_attributes=True)."""
    model_config = ConfigDict(from_attributes=True)

class TimestampedOut(ORMBase):
    created_at: datetime | None = None

class PageMeta(ORMBase):
    total: int # Tổng số bản ghi có trong database
    limit: int # Số bản ghi trả về trên mỗi trang
    offset: int # Vị trí bắt đầu của trang hiện tại

class Page(ORMBase):
    meta: PageMeta # Thông tin phân trang
    data: list # Danh sách dữ liệu thực tế của trang hiện tại

