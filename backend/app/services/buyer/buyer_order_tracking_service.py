from fastapi import HTTPException, status, Depends
from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from ...config.db import get_db
from app.models import Order, Seller, Product, ProductImage, OrderItem, ProductVariant, ProductSize
from app.models.enums import OrderStatusEnum, PaymentStatusEnum
from ...schemas.order import BuyerOrderTrackingItem, OrderTrackingFirstItem
from ...config import public_url
# ===================== TAB MAPPING =====================
TAB_MAPPING = {
    # Tất cả
    "all": {},

    # Chờ xác nhận
    "pending": {
        "order_status": ["pending"]
    },

    # Đang xử lý
    "processing": {
        "order_status": ["processing"]
    },

    # Vận chuyển / Chờ giao hàng
    "shipping": {
        "order_status": ["shipped"]
    },

    # Hoàn thành
    "completed": {
        "order_status": ["delivered"],
        "payment_status": ["paid"]
    },

    # Đã hủy
    "cancelled": {
        "order_status": ["cancelled"]
    },

    # Trả hàng / Hoàn tiền
    "refund": {
        "order_status": ["returned"],
        "payment_status": ["refunded"]
    },
}


class BuyerOrderTrackingService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # ===================== GET ORDER (INTERNAL) =====================
    async def _get_order(self, buyer_id: int, order_id: int) -> Order:
        stmt = select(Order).where(
            Order.order_id == order_id,
            Order.buyer_id == buyer_id
        )
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn hàng"
            )

        return order
    
     # ===================== LIST ORDER (TRACKING VIEW) =====================
    async def list_orders_tracking(self, buyer_id: int, tab: str):
        tab = tab.strip().lower()

        if tab not in TAB_MAPPING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tab không hợp lệ"
            )

        rule = TAB_MAPPING[tab]

        stmt = (
            select(
                Order,

                Seller.shop_name,

                Product.product_id,
                Product.name,

                ProductVariant.variant_name,
                ProductSize.size_name,

                OrderItem.quantity,
                OrderItem.unit_price,

                ProductImage.image_url
            )
            .join(OrderItem, OrderItem.order_id == Order.order_id)
            .join(Product, Product.product_id == OrderItem.product_id)
            .join(ProductVariant, ProductVariant.variant_id == OrderItem.variant_id)
            .join(ProductSize, ProductSize.size_id == OrderItem.size_id)
            .join(Seller, Seller.seller_id == Product.seller_id)
            .outerjoin(
                ProductImage,
                and_(
                    ProductImage.product_id == Product.product_id,
                    ProductImage.is_primary == True
                )
            )
            .where(Order.buyer_id == buyer_id)
            .order_by(Order.order_id, OrderItem.order_item_id)
        )

        if "order_status" in rule:
            stmt = stmt.where(Order.order_status.in_(rule["order_status"]))

        if "payment_status" in rule:
            stmt = stmt.where(Order.payment_status.in_(rule["payment_status"]))

        stmt = stmt.order_by(desc(Order.order_date))

        rows = (await self.db.execute(stmt)).all()

        orders_map = {}

        for row in rows:
            (
                order,
                shop_name,
                product_id,
                product_name,
                variant_name,
                size_name,
                quantity,
                unit_price,
                image_url
            ) = row

            if order.order_id not in orders_map:
                orders_map[order.order_id] = {
                    "order": order,
                    "shop_name": shop_name,
                    "first_item": {
                        "product_id": product_id,
                        "product_name": product_name,
                        "public_url": public_url(image_url),
                        "variant_name": variant_name,
                        "size_name": size_name,
                        "quantity": quantity,
                        "unit_price": unit_price
                    },
                    "count": 0
                }

            orders_map[order.order_id]["count"] += 1

        # returrn list
        return [
        BuyerOrderTrackingItem(
            order_id=data["order"].order_id,
            order_status=data["order"].order_status,

            shop_name=data["shop_name"],

            first_item=OrderTrackingFirstItem(**data["first_item"]),
            total_items=data["count"],

            subtotal=data["order"].subtotal,
            total_price=data["order"].total_price,

            order_date=data["order"].order_date
        )
        for data in orders_map.values()
    ]

    
    # ===================== BUYER HỦY ĐƠN =====================
    async def cancel_order(self, buyer_id: int, order_id: int):
        order = await self._get_order(buyer_id, order_id)

        if order.order_status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chỉ được huỷ đơn khi đang ở trạng thái pending"
            )

        order.order_status = "cancelled"

        # Nếu muốn: cập nhật payment_status
        if order.payment_status == "pending":
            order.payment_status = "failed"

        await self.db.commit()
        await self.db.refresh(order)

        return order

    # ===================== BUYER XÁC NHẬN ĐÃ NHẬN HÀNG =====================
    async def confirm_received(self, buyer_id: int, order_id: int):
        order = await self._get_order(buyer_id, order_id)

        if order.order_status != "shipped":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chỉ xác nhận khi đơn hàng đang được giao"
            )

        order.order_status = "delivered"
        order.delivery_date = datetime.now()
        order.payment_status = "paid"

        await self.db.commit()
        await self.db.refresh(order)

        return order

def get_tracking_service(
    db: AsyncSession = Depends(get_db),
):
    return BuyerOrderTrackingService(db)