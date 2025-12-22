from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...config.db import get_db
from ...models import Order
from ...services.common.notification_service import BaseNotificationService

class BuyerNotificationService(BaseNotificationService):
    """
    Service chuyên trách gửi thông báo cho Buyer.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(db)


    async def notify_order_confirmed(self, order: Order):
        """
        Báo cho Buyer biết đơn hàng đã được Shop xác nhận.
        """
        title = "Đơn hàng đã được xác nhận"
        message = f"Đơn hàng #{order.order_id} của bạn đã được xác nhận và đang chuẩn bị hàng."

        data = {
            "order_id": order.order_id,
            "role": "buyer",
            "action": "view_order_detail",
            "status": "processing"
        }

        # Gọi hàm send_unicast từ BaseNotificationService
        await self.send_unicast(
            user_id=order.buyer_id,
            role="buyer",
            title=title,
            message=message,
            event="order_update",
            data=data
        )


    async def notify_order_shipped(self, order: Order):
        """
        Báo cho Buyer biết đơn hàng đã được bàn giao cho vận chuyển.
        """
        title = "Đơn hàng đang được giao"
        message = f"Đơn hàng #{order.order_id} đã được bàn giao cho đơn vị vận chuyển. Vui lòng chú ý điện thoại."

        data = {
            "order_id": order.order_id,
            "role": "buyer",
            "action": "view_order_detail",
            "status": "shipped"
        }

        await self.send_unicast(
            user_id=order.buyer_id,
            role="buyer",
            title=title,
            message=message,
            event="order_update",
            data=data
        )

def get_buyer_notif_service(db: AsyncSession = Depends(get_db)):
    return BuyerNotificationService(db)