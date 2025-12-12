from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload, Query
from ...schemas.product import ProductResponse
from ...models import Product, ProductSize, ProductImage, ProductVariant
from sqlalchemy import and_
from typing import Optional
from ...models.cart import ShoppingCart, ShoppingCartItem
from datetime import datetime, date
from ...models.catalog import Discount, Carrier
from ...models.order import Order, OrderItem
from decimal import Decimal

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

# ======================= GỘP CÁC BƯỚC TRONG THANH TOÁN =====================
class CheckoutTotalRequest(BaseModel):
    selected_cart_item_ids: list[int]
    discount_code: str |None  # default là chuỗi rỗng
    carrier_id: int | None = None
# ----- 1) Tính subtotal và tổng trọng lượng -----
def calc_subtotal_by_ids(item_ids: list[int], cart_items: list["ShoppingCartItem"]):
    cart_data = {item.shopping_cart_item_id: item for item in cart_items}

    subtotal = Decimal(0)
    total_weight = Decimal(0)

    for item_id in item_ids:
        item = cart_data.get(item_id)
        if not item:
            continue
        product = item.product
        if not product:
            continue
        subtotal += Decimal(getattr(product, "base_price", 0)) * item.quantity
        total_weight += Decimal(getattr(product, "weight", 0)) * item.quantity

    return subtotal, total_weight

# ----- 2) Tính discount -----
def calc_discount(db: Session, subtotal: Decimal, discount_code: str | None):
    """
    Tính tiền giảm giá dựa trên discount_code.
    
    Args:
        db: Session database
        subtotal: tổng tiền trước giảm giá
        discount_code: mã giảm giá (có thể None)

    Returns:
        tuple(Decimal, int | None): discount_amount, discount_id
    """
    # Nếu không nhập mã, trả về 0
    if not discount_code:
        return Decimal(0), None

    if discount_code == "string":
        return Decimal(0), None
    # Lấy mã giảm giá hợp lệ
    discount = db.query(Discount).filter_by(code=discount_code, is_active=True).first()
    if not discount:
        raise HTTPException(400, "Mã giảm giá không hợp lệ")

    # Kiểm tra thời gian
    #today = date.today()
    today = date(2025,9,28)
    if not (discount.start_date <= today <= discount.end_date):
        raise HTTPException(400, "Mã giảm giá chưa đến hạn hoặc đã hết hạn")

    # Tính tiền giảm giá
    discount_amount = subtotal * Decimal(discount.discount_percent) / Decimal(100)
    if discount_amount > Decimal(discount.max_discount):
        discount_amount = Decimal(discount.max_discount)

    return discount_amount, discount.discount_id

# ----- 3) Tính phí vận chuyển -----
def calc_shipping(db: Session, total_weight: Decimal, carrier_id: int):
    if not carrier_id:
        return Decimal(0), None, None
    carrier = db.query(Carrier).filter_by(carrier_id=carrier_id, is_active=True).first()
    if not carrier:
        raise HTTPException(400, "Đơn vị vận chuyển không hợp lệ")
    shipping_fee = Decimal(carrier.base_price) + Decimal(carrier.price_per_kg) * total_weight
    return shipping_fee, carrier.carrier_id, carrier.carrier_name

# ----- 4) Tính tổng checkout (backend truth) -----
def checkout_total(db: Session, buyer_id: int, selected_cart_item_ids: list[int], discount_code: str = None, carrier_id: int = None):
    """
    Checkout dựa trên danh sách shopping_cart_item_id, dùng chung hàm calc_subtotal_by_ids.
    """
    # Lấy giỏ hàng của buyer
    cart = db.query(ShoppingCart).filter_by(buyer_id=buyer_id).first()
    if not cart or not cart.items:
        raise HTTPException(400, "Giỏ hàng trống")

    # Lọc item theo id
    items = [item for item in cart.items if item.shopping_cart_item_id in selected_cart_item_ids]
    if not items:
        raise HTTPException(400, "Không có sản phẩm nào được chọn")

    # Tính subtotal và total_weight bằng hàm thống nhất
    subtotal, total_weight = calc_subtotal_by_ids(selected_cart_item_ids, items)
    
    # Tính discount
    if discount_code:  # chỉ tính discount khi discount_code không rỗng
        discount_amount, discount_id = calc_discount(db, subtotal, discount_code)
    else:
        discount_amount = Decimal(0)
        discount_id = None
    
    # Tính shipping
    shipping_fee, carrier_id, carrier_name = calc_shipping(db, total_weight, carrier_id)
    
    # Tổng cuối cùng
    total_payment = subtotal - discount_amount + shipping_fee

    return {
        "subtotal": subtotal,
        "total_weight": total_weight,
        "discount": discount_amount,
        "shipping_fee": shipping_fee,
        "total_payment": total_payment,
        "carrier_id": carrier_id,
        "discount_id": discount_id,
        "items": items
    }

