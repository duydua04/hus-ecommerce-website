from datetime import datetime
from fastapi import HTTPException, Depends, status
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload, load_only

from ...config.db import get_db
from ...models import Order, OrderItem, Product, BuyerAddress, Buyer
from ...schemas.common import OrderStatus, PageMeta, Page
from ...schemas.seller_order import (
    SellerOrderFilter,
    SellerOrderDetailResponse,
    SellerOrderListItem,
    BuyerInfoShort
)
from ...schemas.address import AddressResponse
from ...schemas.order import OrderItemResponse

from ..buyer.buyer_notification_service import BuyerNotificationService, get_buyer_notif_service

from ..common.inventory_service import inventory_service
from ...tasks.inventory import update_stock_db


class SellerOrderService:
    def __init__(self, db: AsyncSession, notif_service: BuyerNotificationService):
        self.db = db
        self.notif_service = notif_service

    async def _get_order_lightweight(self, seller_id: int, order_id: int):
        """
        Lấy các trường cần thiết để kiểm tra logic (Status, ID, BuyerID).
        """
        stmt = (
            select(Order)
            .join(Order.items)
            .join(OrderItem.product)
            .where(
                Order.order_id == order_id,
                Product.seller_id == seller_id
            )
            .options(
                load_only(
                    Order.order_id,
                    Order.order_status,
                    Order.notes,
                    Order.buyer_id
                ),
                selectinload(Order.items).load_only(
                    OrderItem.size_id,
                    OrderItem.quantity,
                    OrderItem.order_item_id
                )
            )
            .distinct()
        )

        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Đơn hàng không tồn tại hoặc không thuộc shop của bạn"
            )
        return order


    async def list_orders(self, seller_id: int, filters: SellerOrderFilter) -> Page:
        """
        Lấy danh sách đơn hàng có phân trang
        """

        stmt = (
            select(Order)
            .join(Order.items)
            .join(OrderItem.product)
            .where(Product.seller_id == seller_id)
            .distinct()
        )

        if filters.status:
            stmt = stmt.where(Order.order_status == filters.status)
        if filters.date_from:
            stmt = stmt.where(Order.order_date >= filters.date_from)
        if filters.date_to:
            stmt = stmt.where(Order.order_date <= filters.date_to)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        offset = (filters.page - 1) * filters.limit

        stmt = (
            stmt
            .options(
                load_only(
                    Order.order_id, Order.order_date,
                    Order.order_status, Order.payment_status,
                    Order.payment_method, Order.total_price
                ),
                joinedload(Order.buyer).load_only(Buyer.fname, Buyer.lname),
                selectinload(Order.items).load_only(OrderItem.order_item_id)
            )
            .order_by(desc(Order.order_date))
            .offset(offset)
            .limit(filters.limit)
        )

        result = await self.db.execute(stmt)
        orders = result.scalars().all()

        data = []
        for o in orders:
            # Map sang DTO item hiển thị
            item = SellerOrderListItem(
                order_id=o.order_id,
                order_date=o.order_date,
                order_status=o.order_status,
                payment_status=o.payment_status,
                payment_method=o.payment_method,
                total_price=o.total_price,

                buyer_name=f"{o.buyer.fname} {o.buyer.lname or ''}".strip(),
                item_count=len(o.items)
            )
            data.append(item)

        return Page(
            meta=PageMeta(
                total=total,
                limit=filters.limit,
                offset=offset
            ),
            data=data
        )


    async def get_order_detail(self, seller_id: int, order_id: int) -> SellerOrderDetailResponse:
        stmt = (
            select(Order)
            .join(Order.items)
            .join(OrderItem.product)
            .where(
                Order.order_id == order_id,
                   Product.seller_id == seller_id
            )
            .options(
                selectinload(Order.items),
                selectinload(Order.buyer),
                selectinload(Order.carrier),
                selectinload(Order.shipping_address).selectinload(BuyerAddress.address)
            )
        )
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn hàng"
            )

        real_addr = order.shipping_address.address
        addr_resp = AddressResponse.model_validate(real_addr)

        buyer_resp = BuyerInfoShort.model_validate(order.buyer)
        buyer_resp.full_name = f"{order.buyer.fname} {order.buyer.lname or ''}".strip()

        items_resp = [OrderItemResponse.model_validate(i) for i in order.items]

        return SellerOrderDetailResponse(
            order_id=order.order_id,
            order_date=order.order_date,
            delivery_date=order.delivery_date,
            order_status=order.order_status,
            payment_status=order.payment_status,
            payment_method=order.payment_method,
            subtotal=order.subtotal,
            shipping_price=order.shipping_price,
            discount_amount=order.discount_amount,
            total_price=order.total_price,
            notes=order.notes,

            carrier_name=order.carrier.carrier_name if order.carrier else "N/A",
            buyer_info=buyer_resp,
            shipping_address_detail=addr_resp,
            items=items_resp
        )


    async def confirm_order(self, seller_id: int, order_id: int):
        """Xác nhận đơn hàng (Pending -> Processing)"""
        order = await self._get_order_lightweight(seller_id, order_id)

        if order.order_status != OrderStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xác nhận đơn ở trạng thái {order.order_status}"
            )

        order.order_status = OrderStatus.processing
        await self.db.commit()

        await self.notif_service.notify_order_confirmed(order)

        return {"message": "Đã xác nhận đơn hàng", "status": OrderStatus.processing}


    async def mark_as_shipped(self, seller_id: int, order_id: int):
        """Giao hàng (Processing -> Shipped)"""
        order = await self._get_order_lightweight(seller_id, order_id)

        if order.order_status != OrderStatus.processing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Đơn hàng phải được xác nhận trước khi giao"
            )

        order.order_status = OrderStatus.shipped
        order.delivery_date = datetime.now()
        await self.db.commit()

        await self.notif_service.notify_order_shipped(order)

        return {"message": "Đã cập nhật trạng thái giao hàng", "status": OrderStatus.shipped}


    async def cancel_order(self, seller_id: int, order_id: int, reason: str):
        """Hủy đơn hàng và Hoàn kho"""
        order = await self._get_order_lightweight(seller_id, order_id)

        allowed = [OrderStatus.pending, OrderStatus.processing]
        if order.order_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể huỷ đơn hàng đã giao"
            )

        order.order_status = OrderStatus.cancelled
        order.notes = f"{order.notes or ''} | [Shop Cancel]: {reason}"

        for item in order.items:
            await inventory_service.restore_stock(item.size_id, item.quantity)
            update_stock_db.delay(item.size_id, item.quantity)

        await self.db.commit()
        return {"message": "Đã huỷ đơn hàng và hoàn kho", "status": OrderStatus.cancelled}


    async def get_stats(self, seller_id: int):
        stmt = (
            select(Order.order_status, func.count(Order.order_id))
            .join(Order.items).join(OrderItem.product)
            .where(Product.seller_id == seller_id)
            .group_by(Order.order_status)
        )
        result = await self.db.execute(stmt)
        stats = {s.value: 0 for s in OrderStatus}
        for status_enum, count in result.all():
            if status_enum: stats[status_enum.value] = count
        return stats


def get_seller_order_service(
        db: AsyncSession = Depends(get_db),
        notif_service: BuyerNotificationService = Depends(get_buyer_notif_service)
):
    return SellerOrderService(db, notif_service)