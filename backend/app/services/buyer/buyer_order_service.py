from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload, Query
from ...schemas.product import ProductResponse
from ...models import Product, ProductSize, ProductImage, ProductVariant
from sqlalchemy import and_
from typing import Optional
from ...models.cart import ShoppingCart, ShoppingCartItem
from datetime import datetime, date
from ...config.s3 import public_url
from sqlalchemy.orm import joinedload
from collections import defaultdict
from ...models.catalog import Discount, Carrier

# =============== BƯỚC ÁP MÃ GIẢM GIÁ ===========================
class ApplyDiscountRequest(BaseModel):
    code: str
    order_total: float

def apply_discount_code(db: Session, code: str, order_total: float):
    # 1. Kiểm tra mã tồn tại
    discount = db.query(Discount).filter(Discount.code == code).first()
    if not discount:
        raise HTTPException(status_code=404, detail="Mã giảm giá không tồn tại")

    # 2. Kiểm tra active
    if not discount.is_active:
        raise HTTPException(status_code=400, detail="Mã giảm giá không còn hiệu lực")

    # 3. Kiểm tra thời gian
    # now = datetime.now().date()
    now = date(2025, 9, 28)
    if not (discount.start_date <= now <= discount.end_date):
        raise HTTPException(status_code=400, detail="Mã giảm giá đã hết hạn hoặc chưa đến hạn")

    # 4. Kiểm tra số lượt dùng
    if discount.used_count >= discount.usage_limit:
        raise HTTPException(status_code=400, detail="Mã giảm giá đã hết lượt sử dụng")

    # 5. Kiểm tra giá trị tối thiểu
    if order_total < discount.min_order_value:
        raise HTTPException(
            status_code=400,
            detail=f"Đơn hàng phải tối thiểu {discount.min_order_value} để áp mã"
        )

    # 6. Tính tiền giảm
    discount_amount = float(order_total) * float(discount.discount_percent) / 100

    # giới hạn max_discount
    discount_amount = min(discount_amount, float(discount.max_discount))

    # 7. Tổng cuối
    final_total = float(order_total) - discount_amount

    return {
        "code": discount.code,
        "percent": discount.discount_percent,
        "discount_amount": float(discount_amount),
        "final_total": float(final_total)
    }

# =============== BƯỚC CHỌN ĐƠN VỊ VẬN CHUYỂN VÀ TÍNH TỔNG TIỀN ==============
def calculate_total_with_shipping(db: Session, carrier_id: int, total_weight: float, subtotal: float, discount_amount: float):
    carrier = db.query(Carrier).get(carrier_id)
    if not carrier or not carrier.is_active:
        raise HTTPException(status_code=400, detail="DVVC không hợp lệ")
    
    shipping_fee = float(carrier.base_price) + float(carrier.price_per_kg) * total_weight
    total_payment = subtotal - discount_amount + shipping_fee

    return {
        "carrier_id": carrier.carrier_id,
        "carrier_name": carrier.carrier_name,
        "shipping_fee": shipping_fee,
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "total_payment": total_payment
    }