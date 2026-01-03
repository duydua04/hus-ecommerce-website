import asyncio
from decimal import Decimal
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import select, and_, desc, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload


from ...config.db import get_db
from datetime import datetime, date
from ...config.s3 import public_url
from ...models import (
    Order,
    OrderItem,
    ShoppingCart,
    ShoppingCartItem,
    Carrier,
    Discount,
    BuyerAddress,
    Address,
    Product,
    ProductVariant,
    ProductSize,
    Seller,
    ProductImage,
    ProductSize
)
from ...schemas.order import OrderCreate, OrderDetailResponse, OrderDetailResponse, OrderResponse, BuyerOrderTrackingItem, OrderTrackingFirstItem, OrderItemResponseNew
from ...schemas.address import AddressResponse, AddressUpdate
from ...schemas.carrier import CarrierCalculateResponse, CarrierResponse
from ...schemas.common import OrderStatus, PaymentStatus
from app.tasks.admin_dashboard_task import task_admin_add_order_stats
from app.tasks.seller_dashboard_task import task_seller_recalc_dashboard
from app.tasks.notification_task import task_send_notification
from app.tasks.inventory import update_stock_db

from ...config.db import engine
from sqlalchemy.ext.asyncio import async_sessionmaker
# ===================== TAB MAPPING =====================
TAB_MAPPING = {
    "all": {},

    "pending": {
        "order_status": ["pending"]
    },
    "processing": {
        "order_status": ["processing"]
    },
    "shipped": {
        "order_status": ["shipped"]
    },

    "delivered": {
        "order_status": ["delivered"],
        "payment_status": ["paid"]
    },

    "cancelled": {
        "order_status": ["cancelled"]
    },

    "returned": {
        "order_status": ["returned"],
        "payment_status": ["refunded"]
    },
}

class BuyerOrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
    async def _get_order_with_items(self, buyer_id: int, order_id: int) -> Order:
        """Lấy thông tin đơn hàng kèm danh sách items"""
        from sqlalchemy.orm import selectinload
        
        stmt = (
            select(Order)
            .options(selectinload(Order.items)) # Chỉ load items
            .where(Order.order_id == order_id, Order.buyer_id == buyer_id)
        )
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng hoặc bạn không có quyền")
            
        return order
    
    # ===================== LẤY CHI TIẾT CÁC SẢN PHẨM ĐÃ CHỌN ĐỂ THANH TOÁN =====
    async def get_selected_cart_items(self, shopping_cart_item_ids: list[int]):
        if not shopping_cart_item_ids:
            return []

        stmt = (
            select(ShoppingCartItem)
            .options(
                selectinload(ShoppingCartItem.product)
                .selectinload(Product.images),

                selectinload(ShoppingCartItem.product)
                .selectinload(Product.variants)
                .selectinload(ProductVariant.sizes),

                selectinload(ShoppingCartItem.product)
                .selectinload(Product.seller),
            )
            .where(ShoppingCartItem.shopping_cart_item_id.in_(shopping_cart_item_ids))
        )

        result = await self.db.execute(stmt)
        items = result.scalars().unique().all()

        data = []
        for item in items:
            product = item.product
            seller = product.seller

            seller_info = {
                "seller_id": seller.seller_id if seller else None,
                "shop_name": seller.shop_name if seller else "Unknown Seller"
            }

            image_url = (
                public_url(product.images[0].image_url)
                if product.images else None
            )

            variant = next(
                (v for v in product.variants if v.variant_id == item.variant_id),
                None,
            )
            size = (
                next((s for s in variant.sizes if s.size_id == item.size_id), None)
                if variant else None
            )

            # ===== GIÁ SAU DISCOUNT =====
            base_price = product.base_price + (variant.price_adjustment if variant else 0)
            sale_price = base_price * (100 - product.discount_percent) / 100

            # ===== CÂN NẶNG =====
            unit_weight = float(product.weight or 0)
            total_weight = unit_weight * item.quantity

            data.append({
                "shopping_cart_item_id": item.shopping_cart_item_id,
                "product_id": product.product_id,
                "name": product.name,
                "variant_id": variant.variant_id if variant else None,
                "variant_name": variant.variant_name if variant else None,
                "size_id": size.size_id if size else None,
                "size_name": size.size_name if size else None,
                "quantity": item.quantity,
                "price": float(sale_price),
                "weight": unit_weight,
                "total_weight": total_weight,
                "public_image_url": image_url,
                "seller": seller_info
            })

        return data
    
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
                .selectinload(Product.variants),      # load variants
                selectinload(ShoppingCart.items)
                .selectinload(ShoppingCartItem.variant)  # load variant đã chọn
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

        # 2. VALIDATE TỒN KHO TRƯỚC KHI LÀM BẤT CỨ VIỆC GÌ (Reserve Stock Logic)
        #Việc này đảm bảo 100% không bao giờ bán lố
        # for item in selected_items:
        #     stock_stmt = select(ProductSize).where(ProductSize.size_id == item.size_id).with_for_update()
        #     stock_res = await self.db.execute(stock_stmt)
        #     size_obj = stock_res.scalar_one_or_none()

        #     if not size_obj or size_obj.available_units < item.quantity:
        #         raise HTTPException(400, f"Hết hàng: {item.product.name}")
            
        #     # TRỪ LUÔN TẠI ĐÂY
        #     size_obj.available_units -= item.quantity

        # Validate buyer_address_id
        address = await self.db.get(BuyerAddress, payload.buyer_address_id)
        if not address or address.buyer_id != buyer_id:
            raise HTTPException(403, "Địa chỉ không hợp lệ")

        # Tính subtotal
        subtotal = sum(
            (Decimal(item.product.base_price + (item.variant.price_adjustment if item.variant else 0))
            * (100 - Decimal(item.product.discount_percent)) / 100) * item.quantity
            for item in selected_items
        )

        # Tính discount (nếu có)
        discount_amount = Decimal(0)
        discount_id = payload.discount_id  # giữ giá trị ban đầu
        if discount_id is not None:
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
        else:
            discount_id = None  # đảm bảo insert DB không bị lỗi ForeignKey
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

        # 1. TẠO ĐƠN HÀNG VÀ ITEMS (Chưa commit)
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
        await self.db.flush() 

        for item in selected_items:
            # Trừ kho đồng bộ ngay tại đây (An toàn nhất)
            stock_stmt = select(ProductSize).where(ProductSize.size_id == item.size_id).with_for_update()
            size_obj = (await self.db.execute(stock_stmt)).scalar_one_or_none()
            if not size_obj or size_obj.available_units < item.quantity:
                raise HTTPException(400, f"Sản phẩm {item.product.name} đã hết hàng")
            size_obj.available_units -= item.quantity

            # Tạo OrderItem
            variant_price = item.variant.price_adjustment if item.variant else 0
            unit_price = (item.product.base_price + variant_price) * (100 - item.product.discount_percent) / 100
            self.db.add(OrderItem(
                order_id=order.order_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                size_id=item.size_id,
                quantity=item.quantity,
                unit_price=unit_price,
                total_price=unit_price * item.quantity
            ))
            # Xóa khỏi giỏ hàng
            await self.db.delete(item)
        # 1.5 CẬP NHẬT USED_COUNT CỦA DISCOUNT (Nếu có dùng mã)
        if payload.discount_id is not None:
            # Truy vấn lại discount với row-level lock để tránh race condition
            discount_stmt = select(Discount).where(Discount.discount_id == payload.discount_id).with_for_update()
            discount_obj = (await self.db.execute(discount_stmt)).scalar_one_or_none()
            
            if discount_obj:
                # Kiểm tra lại giới hạn sử dụng một lần nữa trước khi tăng count
                if discount_obj.usage_limit is not None and discount_obj.used_count >= discount_obj.usage_limit:
                    raise HTTPException(400, "Mã giảm giá đã hết lượt sử dụng")
                
                # Tăng số lần đã dùng
                discount_obj.used_count += 1

        # 2. LẤY SELLER_ID TRƯỚC KHI COMMIT (Rất quan trọng)
        seller_id = selected_items[0].product.seller_id

        # 3. CHỐT TRANSACTION DUY NHẤT
        await self.db.commit()
        await self.db.refresh(order)

        # 4. GỌI CELERY (Sau khi mọi thứ ở DB đã xong)
        task_seller_recalc_dashboard.delay(seller_id) 
        task_send_notification.delay(
            user_id=seller_id,
            role="seller",
            title="Đơn hàng mới",
            message=f"Bạn có đơn hàng mới #{order.order_id}",
            event_type="NEW_ORDER",
            data={"order_id": order.order_id}
        )

        return order

   # ===================== CHI TIẾT ĐƠN HÀNG =====================
    async def get_order_detail(self, buyer_id: int, order_id: int):
        # Lấy order với các relation cần thiết
        stmt = (
        select(Order)
        .options(
            selectinload(Order.items)
            .selectinload(OrderItem.product)  # Product
            .selectinload(Product.variants),  # ProductVariant

            selectinload(Order.items)
            .selectinload(OrderItem.product)  # Product
            .selectinload(Product.images),    # ProductImage

            selectinload(Order.items)
            .selectinload(OrderItem.variant), # Liên kết trực tiếp OrderItem -> variant
            selectinload(Order.items)
            .selectinload(OrderItem.size),    # Liên kết trực tiếp OrderItem -> size

            selectinload(Order.items)
            .selectinload(OrderItem.product)
            .selectinload(Product.seller)     # Product -> Seller
        )
        .where(Order.buyer_id == buyer_id)
        .where(Order.order_id == order_id)
    )

        order: Order = (await self.db.execute(stmt)).scalars().unique().first()
        if not order:
            raise HTTPException(404, "Không tìm thấy đơn hàng")

        # Lấy địa chỉ và carrier
        shipping_address_obj = await self.db.get(Address, order.buyer_address_id)
        carrier_obj = await self.db.get(Carrier, order.carrier_id)

        shipping_address = AddressResponse.model_validate(shipping_address_obj)
        carrier = CarrierResponse(
            carrier_id=carrier_obj.carrier_id,
            carrier_name=carrier_obj.carrier_name,
            carrier_avt_url=public_url(carrier_obj.carrier_avt_url),
            shipping_fee=order.shipping_price
        )

        items_data = []
        for item in order.items:
            product = item.product
            variant = item.variant
            size = item.size
            seller_name = product.seller.shop_name if product.seller else "Unknown Seller"

            # Ảnh chính
            primary_image = next((img for img in product.images if img.is_primary), None)
            image_url = public_url(primary_image.image_url) if primary_image else None

            # Tính giá
            base_price = Decimal(product.base_price)
            price_adjustment = Decimal(variant.price_adjustment) if variant else Decimal(0)
            total_base_price = base_price + price_adjustment

            price_after_discount = total_base_price * (Decimal(100) - product.discount_percent) / Decimal(100)
            total_price = price_after_discount * Decimal(item.quantity)

            # Map sang OrderItemResponse
            items_data.append(OrderItemResponseNew(
                order_item_id=item.order_item_id,
                order_id=item.order_id,
                product_id=product.product_id,
                product_id_name=product.name,
                variant_id=variant.variant_id if variant else None,
                variant_name=variant.variant_name if variant else "",
                size_id=size.size_id if size else None,
                size_name=size.size_name if size else "",
                quantity=item.quantity,
                unit_price=item.unit_price,
                # total_price=total_price,
                base_price_plus_adjustment=total_base_price,
                # price_after_discount=price_after_discount,
                # weight=Decimal(product.weight or 0),
                # total_weight=Decimal(product.weight or 0) * Decimal(item.quantity),
                public_image_url=image_url,
                seller=seller_name
            ))

        order_response = OrderResponse.model_validate(order)

        return OrderDetailResponse(
            order=order_response,
            shipping_address=shipping_address,
            items=items_data,
            carrier=carrier,
        )
    # ==================== UPDATE ĐỊA CHỈ KHI ĐƠN HÀNG ĐANG CHỜ XỬ LÝ ===================
    async def update_order_shipping_address(
        self,
        buyer_id: int,
        order_id: int,
        payload: AddressUpdate
    ):
        stmt = (
            select(Order)
            .where(
                Order.order_id == order_id,
                Order.buyer_id == buyer_id
            )
        )

        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(404, "Không tìm thấy đơn hàng")

        # Check trạng thái
        if order.order_status != "pending":
            raise HTTPException(
                400,
                "Chỉ có thể thay đổi địa chỉ khi đơn hàng chưa xử lý"
            )

        # Lấy buyer_address hiện tại
        stmt = (
            select(BuyerAddress)
            .where(BuyerAddress.buyer_address_id == order.buyer_address_id)
        )
        result = await self.db.execute(stmt)
        buyer_address = result.scalar_one()

        # Update address
        stmt = (
            select(Address)
            .where(Address.address_id == buyer_address.address_id)
        )
        result = await self.db.execute(stmt)
        address = result.scalar_one()

        address.fullname = payload.fullname
        address.phone = payload.phone
        address.province = payload.province
        address.district = payload.district
        address.ward = payload.ward
        address.street = payload.street

        await self.db.commit()

        return {"message": "Cập nhật địa chỉ giao hàng thành công"}
    
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
        if tab is None:
            tab = "all"
        if tab not in TAB_MAPPING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tab không hợp lệ"
            )

        rule = TAB_MAPPING[tab]

        # Eager load các quan hệ cần thiết
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.variants),
                
                selectinload(Order.items)
                .selectinload(OrderItem.variant),

                selectinload(Order.items)
                .selectinload(OrderItem.size),

                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.seller),

                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.images)
            )
            .where(Order.buyer_id == buyer_id)
            .order_by(desc(Order.order_date))
        )

        if "order_status" in rule:
            stmt = stmt.where(Order.order_status.in_(rule["order_status"]))

        if "payment_status" in rule:
            stmt = stmt.where(Order.payment_status.in_(rule["payment_status"]))

        orders = (await self.db.execute(stmt)).scalars().unique().all()

        orders_map = {}

        for order in orders:
            if not order.items:
                continue

            first_item_obj = order.items[0]
            product = first_item_obj.product
            variant = first_item_obj.variant
            size = first_item_obj.size
            seller_name = product.seller.shop_name if product.seller else "Unknown Seller"

            # Lấy ảnh chính nếu có
            image_url = None
            if product.images:
                primary_image = next((img for img in product.images if img.is_primary), None)
                image_url = public_url(primary_image.image_url) if primary_image else public_url(product.images[0].image_url)

            # Tính base_price + adjustment
            base_price = float(product.base_price)
            price_adjustment = float(variant.price_adjustment) if variant else 0
            total_base_price = base_price + price_adjustment

            orders_map[order.order_id] = {
                "order": order,
                "shop_name": seller_name,
                "first_item": {
                    "product_id": product.product_id,
                    "product_name": product.name,
                    "public_url": image_url,
                    "variant_name": variant.variant_name if variant else None,
                    "size_name": size.size_name if size else None,
                    "quantity": first_item_obj.quantity,
                    "unit_price": float(first_item_obj.unit_price),
                    "base_price_plus_adjustment": total_base_price
                },
                "count": len(order.items)
            }

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
        # 1. Lấy thông tin đơn hàng
        order = await self._get_order_with_items(buyer_id, order_id)

        # Kiểm tra trạng thái: Chỉ cho hủy nếu đang pending
        if order.order_status != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Không thể hủy đơn hàng ở trạng thái {order.order_status}"
            )

        # 2. PHỤC HỒI KHO (Thực hiện đồng bộ trong Transaction)
        for item in order.items:
            stmt_stock = (
                update(ProductSize)
                .where(ProductSize.size_id == item.size_id)
                .values(available_units=ProductSize.available_units + item.quantity)
            )
            await self.db.execute(stmt_stock)

        # 3. Cập nhật trạng thái đơn hàng và thanh toán
        order.order_status = "cancelled"
        if order.payment_status == "pending":
            order.payment_status = "failed"

        # 4. CHỐT GIAO DỊCH (COMMIT)
        # Tại đây MySQL sẽ thực hiện cộng kho và đổi status đơn hàng cùng lúc
        await self.db.commit()
        await self.db.refresh(order)

        # 5. XỬ LÝ HẬU CẦN QUA CELERY (Bất đồng bộ)
        if order.items:
            # Lấy seller_id bằng truy vấn riêng để tránh lỗi MissingGreenlet (Lazy Load)
            first_item = order.items[0]
            seller_stmt = select(Product.seller_id).where(Product.product_id == first_item.product_id)
            seller_res = await self.db.execute(seller_stmt)
            seller_id = seller_res.scalar()

            if seller_id:
                # Task 1: Cập nhật lại số liệu Dashboard cho Seller
                task_seller_recalc_dashboard.delay(seller_id)

                # Task 2: Gửi thông báo cho Seller
                task_send_notification.delay(
                    user_id=seller_id,
                    role="seller",
                    title="Đơn hàng đã bị hủy",
                    message=f"Đơn hàng #{order.order_id} đã bị khách hàng hủy. Kho đã được hoàn trả.",
                    event_type="ORDER_CANCELLED",
                    data={
                        "order_id": order.order_id,
                        "buyer_id": buyer_id,
                        "time": str(datetime.now())
                    }
                )

        return order
    # ===================== BUYER XÁC NHẬN ĐÃ NHẬN HÀNG =====================
    async def confirm_received(self, buyer_id: int, order_id: int):
        # 1. Lấy đơn hàng kèm đầy đủ thông tin để làm payload
        # Cần joinedload product và category để lấy category_id cho thống kê
        stmt = (
            select(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product)
            )
            .where(Order.order_id == order_id, Order.buyer_id == buyer_id)
        )
        result = await self.db.execute(stmt)
        order = result.unique().scalar_one_or_none()

        if not order:
            raise HTTPException(404, "Không tìm thấy đơn hàng")

        if order.order_status != "shipped":
            raise HTTPException(
                status_code=400,
                detail="Chỉ xác nhận khi đơn hàng đang được giao (shipped)"
            )

        # 2. Cập nhật trạng thái thành công
        order.order_status = "delivered"
        order.delivery_date = datetime.now()
        order.payment_status = "paid"

        ## Lấy thông tin cần thiết trước khi commit
        items_data = [{"product_id": item.product_id, "quantity": item.quantity} for item in order.items]
        seller_id = order.items[0].product.seller_id

        await self.db.commit()

        # 2. Kích hoạt task chạy ngầm để cập nhật số lượng bán
        # Truyền danh sách items để update từng sản phẩm
        await self._bg_sync_sold_stats(items_data, seller_id)
        # 4. CHUẨN BỊ PAYLOAD CHO HỆ THỐNG THỐNG KÊ (ANALYTICS)
        # Giả định đơn hàng thuộc về một seller
        seller_id = order.items[0].product.seller_id

        admin_payload = {
            "order_id": order.order_id,
            "total_price": float(order.total_price), # Tổng doanh thu sàn (Redis: revenue:total)
            "buyer_id": order.buyer_id,              # Xếp hạng Người mua (Redis: rank:buyer)
            "seller_id": seller_id,                  # Xếp hạng Người bán (Redis: rank:seller)
            "carrier_id": order.carrier_id,          # Thống kê Vận chuyển (Redis: stats:carriers)
            "items": [
                {
                    "category_id": item.product.category_id, # Xếp hạng Danh mục (Redis: rank:category)
                    "quantity": item.quantity,               # Số lượng đã bán của danh mục
                    "subtotal": float(item.total_price)      # Doanh thu của danh mục
                }
                for item in order.items
            ]
        }

        # 5. GỌI CÁC TASK CHẠY NGẦM (CELERY) ĐỂ CẬP NHẬT REDIS/DASHBOARD
        
        # A. Cập nhật thống kê tổng cho Admin (Real-time Stats bằng Redis Sorted Sets)
        task_admin_add_order_stats.delay(admin_payload)

        # B. Tính toán lại doanh thu/dashboard cho Người bán
        task_seller_recalc_dashboard.delay(seller_id)
        
        # C. Gửi thông báo cho Seller biết tiền đã về ví
        task_send_notification.delay(
            user_id=seller_id,
            role="seller",
            title="Đơn hàng hoàn tất",      # Bạn đang thiếu tham số này
            message=f"Đơn hàng #{order.order_id} đã hoàn tất. Doanh thu đã được ghi nhận.",
            event_type="ORDER_COMPLETED",   # Bạn đang thiếu tham số này
            data={"order_id": order.order_id} # Bạn đang thiếu tham số này
        )

        return order
    
    async def _bg_sync_sold_stats(self, items_data: list, seller_id: int):
        async_session = async_sessionmaker(engine, expire_on_commit=False)

        async with async_session() as new_db:
            try:
                for item in items_data:
                    await new_db.execute(
                        update(Product)
                        .where(Product.product_id == item["product_id"])
                        .values(
                            sold_quantity=Product.sold_quantity + item["quantity"]
                        )
                    )

                # ✅ BẮT BUỘC
                await new_db.commit()

            except Exception as e:
                await new_db.rollback()
                print(f"❌ Failed to sync sold stats: {str(e)}")
            
def get_buyer_order_service(
    db: AsyncSession = Depends(get_db),
):
    return BuyerOrderService(db)