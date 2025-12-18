from decimal import Decimal
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ...config.db import get_db
from ...models import (
    Order,
    OrderItem,
    ShoppingCart,
    ShoppingCartItem,
    Carrier,
    Discount
)
from ...schemas.order import OrderCreate
from ...schemas.common import OrderStatus, PaymentStatus


class BuyerOrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ===================== TẠO ĐƠN HÀNG =====================
    async def place_order(
        self,
        buyer_id: int,
        payload: OrderCreate
    ) -> Order:
        # 1️⃣ Lấy giỏ hàng
        stmt = (
            select(ShoppingCart)
            .options(
                selectinload(ShoppingCart.items)
                .selectinload(ShoppingCartItem.product)
            )
            .where(ShoppingCart.buyer_id == buyer_id)
        )
        cart = (await self.db.execute(stmt)).scalar_one_or_none()

        if not cart or not cart.items:
            raise HTTPException(400, "Giỏ hàng trống")

        # 2️⃣ Tính subtotal
        subtotal = Decimal(0)
        for item in cart.items:
            subtotal += Decimal(item.product.base_price) * item.quantity

        # 3️⃣ Discount (đã validate từ checkout)
        discount_amount = Decimal(0)
        if payload.discount_id:
            discount = await self.db.get(Discount, payload.discount_id)
            if discount:
                discount_amount = min(
                    subtotal * Decimal(discount.discount_percent) / 100,
                    Decimal(discount.max_discount)
                )

        # 4️⃣ Shipping
        carrier = await self.db.get(Carrier, payload.carrier_id)
        if not carrier or not carrier.is_active:
            raise HTTPException(400, "Đơn vị vận chuyển không hợp lệ")

        total_weight = sum(
            Decimal(item.product.weight or 0) * item.quantity
            for item in cart.items
        )

        shipping_price = (
            Decimal(carrier.base_price)
            + Decimal(carrier.price_per_kg) * total_weight
        )

        # 5️⃣ Tổng tiền
        total_price = subtotal + shipping_price - discount_amount

        # 6️⃣ Tạo Order
        order = Order(
            buyer_id=buyer_id,
            buyer_address_id=payload.buyer_address_id,
            payment_method=payload.payment_method,
            subtotal=subtotal,
            shipping_price=shipping_price,
            discount_amount=discount_amount,
            total_price=total_price,
            order_status=OrderStatus.pending,
            payment_status=PaymentStatus.pending,
            discount_id=payload.discount_id,
            carrier_id=payload.carrier_id,
            notes=payload.notes
        )

        self.db.add(order)
        await self.db.flush()  # lấy order_id

        # 7️⃣ Tạo OrderItem
        for item in cart.items:
            order_item = OrderItem(
                order_id=order.order_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                size_id=item.size_id,
                quantity=item.quantity,
                unit_price=item.product.base_price,
                total_price=Decimal(item.product.base_price) * item.quantity
            )
            self.db.add(order_item)

        # 8️⃣ Clear cart
        for item in cart.items:
            await self.db.delete(item)

        await self.db.commit()
        await self.db.refresh(order)

        return order

    # ===================== LIST ĐƠN HÀNG CỦA BUYER =====================
    async def list_my_orders(self, buyer_id: int):
        stmt = (
            select(Order)
            .where(Order.buyer_id == buyer_id)
            .order_by(Order.order_date.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    # ===================== CHI TIẾT ĐƠN HÀNG =====================
    async def get_order_detail(self, buyer_id: int, order_id: int):
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.shipping_address),
                selectinload(Order.carrier)
            )
            .where(
                Order.order_id == order_id,
                Order.buyer_id == buyer_id
            )
        )
        order = (await self.db.execute(stmt)).scalar_one_or_none()

        if not order:
            raise HTTPException(404, "Không tìm thấy đơn hàng")

        return {
            "order": order,
            "shipping_address": order.shipping_address,
            "items": order.items,
            "carrier_name": order.carrier.carrier_name,
            "carrier_avt_url": order.carrier.carrier_avt_url
        }
    
def get_buyer_order_service(
    db: AsyncSession = Depends(get_db),
):
    return BuyerOrderService(db)