from decimal import Decimal
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ...config.db import get_db
from datetime import datetime, date
from ...models import (
    Order,
    OrderItem,
    ShoppingCart,
    ShoppingCartItem,
    Carrier,
    Discount,
    BuyerAddress,
    Address
)
from ...schemas.order import OrderCreate, OrderItemResponse, OrderResponse
from ...schemas.address import AddressResponse
from ...schemas.carrier import CarrierCalculateResponse, CarrierResponse
from ...schemas.common import OrderStatus, PaymentStatus


class BuyerOrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ===================== TẠO ĐƠN HÀNG =====================
    async def place_order(
        self,
        buyer_id: int,
        payload: OrderCreate  # payload có thể thêm field cart_item_ids: list[int]
    ) -> Order:
        # Lấy giỏ hàng
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

        # Lọc các item được chọn
        if not payload.cart_item_ids:
            raise HTTPException(400, "Bạn chưa chọn sản phẩm nào")
        
        selected_items = [
            item for item in cart.items if item.shopping_cart_item_id in payload.cart_item_ids
        ]
        if not selected_items:
            raise HTTPException(400, "Sản phẩm chọn không hợp lệ")

        # Validate buyer_address_id
        address = await self.db.get(BuyerAddress, payload.buyer_address_id)
        if not address or address.buyer_id != buyer_id:
            raise HTTPException(403, "Địa chỉ không hợp lệ")

        # Tính subtotal
        subtotal = sum(
            Decimal(item.product.base_price) * item.quantity
            for item in selected_items
        )

        # Tính discount (nếu có)
        discount_amount = Decimal(0)
        if payload.discount_id:
            discount = await self.db.get(Discount, payload.discount_id)
            # Không tồn tại
            if not discount:
                    raise HTTPException(
                status_code=404,
                detail="Mã giảm giá không tồn tại"
            )
            now = date.today()
            # Hết hạn
            if discount.start_date and now < discount.start_date or \
                discount.end_date and now > discount.end_date:
                    raise HTTPException(
                        status_code=404,
                        detail="Mã giảm giá chưa có hiệu lực hoặc đã hết hạn"
                    )
            # Chưa đủ tiền để áp dụng discount
            if subtotal < discount.min_order_value:
                raise HTTPException(
                    status_code=404,
                    detail=f"Đơn hàng tối thiểu {discount.min_order_value} để áp dụng mã giảm giá"
                )
    
            # Tính discount trực tiếp trên subtotal
            percent = Decimal(discount.discount_percent)
            discount_amount = (Decimal(subtotal) * percent) / Decimal(100)

            if discount.max_discount:
                discount_amount = min(discount_amount, discount.max_discount)

        # Shipping
        carrier = await self.db.get(Carrier, payload.carrier_id)
        if not carrier or not carrier.is_active:
            raise HTTPException(400, "Đơn vị vận chuyển không hợp lệ")

        total_weight = sum(
            Decimal(item.product.weight or 0) * item.quantity
            for item in selected_items
        )
        shipping_price = Decimal(carrier.base_price) + Decimal(carrier.price_per_kg) * total_weight

        # Tổng tiền
        total_price = subtotal + shipping_price - discount_amount

        #Tạo Order
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
        await self.db.flush()  # để lấy order_id

        #Tạo OrderItem
        for item in selected_items:
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

        #Clear các item đã mua khỏi cart
        for item in selected_items:
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
            select(Order, Address, Carrier)  # join cả Address + Carrier
            .join(BuyerAddress, Order.buyer_address_id == BuyerAddress.buyer_address_id)
            .join(Address, BuyerAddress.address_id == Address.address_id)
            .join(Carrier, Order.carrier_id == Carrier.carrier_id)
            .options(
                selectinload(Order.items)  # load list OrderItem
            )
            .where(
                Order.order_id == order_id,
                Order.buyer_id == buyer_id
            )
        )
        
        result = await self.db.execute(stmt)
        row = result.first()
        
        if not row:
            raise HTTPException(404, "Không tìm thấy đơn hàng")
        
        order, shipping_address_obj, carrier_obj = row  # unpack tuple
        
        # Map shipping address
        shipping_address = AddressResponse(
            address_id=shipping_address_obj.address_id,
            fullname=shipping_address_obj.fullname,
            street=shipping_address_obj.street,
            ward=shipping_address_obj.ward,
            district=shipping_address_obj.district,
            province=shipping_address_obj.province,
            phone=shipping_address_obj.phone
        )
        
        # Map order items
        items = [
            OrderItemResponse(
                order_item_id=item.order_item_id,
                order_id=item.order_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                size_id=item.size_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price
            ) for item in order.items
        ]
        
        # Map carrier info
        carrier = CarrierResponse(
            carrier_id=carrier_obj.carrier_id,
            carrier_name=carrier_obj.carrier_name,
            carrier_avt_url=carrier_obj.carrier_avt_url,
            shipping_fee=order.shipping_price
        )
        
        # Map order
        order_response = OrderResponse(
            order_id=order.order_id,
            buyer_id=order.buyer_id,
            buyer_address_id=order.buyer_address_id,
            payment_method=order.payment_method,
            subtotal=order.subtotal,
            shipping_price=order.shipping_price,
            discount_amount=order.discount_amount,
            total_price=order.total_price,
            order_date=order.order_date,
            delivery_date=order.delivery_date,
            order_status=order.order_status,
            payment_status=order.payment_status,
            discount_id=order.discount_id,
            carrier_id=order.carrier_id,
            notes=order.notes
        )
        
        return {
            "order": order_response,
            "shipping_address": shipping_address,
            "items": items,
            "carrier": carrier
        }
    
def get_buyer_order_service(
    db: AsyncSession = Depends(get_db),
):
    return BuyerOrderService(db)