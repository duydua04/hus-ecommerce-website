from fastapi import HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, desc, select, func, asc, cast, Numeric, or_
from sqlalchemy.orm import joinedload
from collections import defaultdict
from datetime import datetime
from typing import Optional
from decimal import Decimal

from ...schemas.cart import CartItemKey
from ...schemas.product import ( UpdateCartItemRequest, UpdateVariantSizeRequest)
from ...models import (
    Product, ProductSize, ProductVariant, ShoppingCart, ShoppingCartItem, Seller
)
from ...config.s3 import public_url
from ...config.db import get_db
from ...config.redis import get_redis_client
from sqlalchemy.orm import selectinload
from ...schemas.common import Page, PageMeta
from redis import Redis
import json
import time

class CartServiceAsync:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis
    def _cart_key(self, buyer_id: int):
        return f"cart:{buyer_id}"

    def _item_key(
        self,
        product_id: int,
        variant_id: int | None,
        size_id: int | None
    ) -> str:
        return f"{product_id}:{variant_id}:{size_id}"
    
    async def count_items(self, buyer_id: int) -> int:
        cart_key = self._cart_key(buyer_id)
        items = await self.redis.hvals(cart_key)

        total = 0
        for raw in items:
            item = json.loads(raw)
            total += item.get("quantity", 0)

        return total
    
    # =================== THÊM SẢN PHẨM VÀO GIỎ HÀNG =======================
    async def add_to_cart(
        self,
        buyer_id: int,
        product_id: int,
        variant_id: int | None = None,
        size_id: int | None = None,
        quantity: int = 1
    ):
        # ===== 1. Validate product =====
        product = await self.db.scalar(
            select(Product).where(Product.product_id == product_id)
        )
        if not product:
            raise HTTPException(404, "Product not found")

        variant = None
        size = None

        # ===== 2. Validate variant =====
        if variant_id is not None:
            variant = await self.db.scalar(
                select(ProductVariant).where(
                    ProductVariant.variant_id == variant_id,
                    ProductVariant.product_id == product_id
                )
            )
            if not variant:
                raise HTTPException(400, "Variant không hợp lệ")

        # ===== 3. Validate size =====
        if size_id is not None:
            size = await self.db.scalar(
                select(ProductSize).where(
                    ProductSize.size_id == size_id,
                    ProductSize.variant_id == variant_id
                )
            )
            if not size:
                raise HTTPException(400, "Size không hợp lệ")

            if size.available_units < quantity:
                raise HTTPException(400, "Không đủ tồn kho")

        # ===== 4. Redis key =====
        cart_key = self._cart_key(buyer_id)
        item_key = self._item_key(product_id, variant_id, size_id)

        raw = await self.redis.hget(cart_key, item_key)

        # ===== 5. Tính giá snapshot =====
        base_price = product.base_price
        if variant:
            base_price += variant.price_adjustment

        sale_price = base_price * (100 - product.discount_percent) / 100

        if raw:
            item = json.loads(raw)
            new_quantity = item["quantity"] + quantity

            # check tồn kho lại
            if size and new_quantity > size.available_units:
                raise HTTPException(400, "Không đủ tồn kho")

            item["quantity"] = new_quantity
        else:
            item = {
                "product_id": product_id,
                "variant_id": variant_id,
                "size_id": size_id,
                "quantity": quantity,
                "price": float(sale_price),   # snapshot giá sau discount
                "added_at": int(time.time())
            }

        await self.redis.hset(cart_key, item_key, json.dumps(item))

        # optional: TTL cho cart (ví dụ 7 ngày)
        await self.redis.expire(cart_key, 60 * 60 * 24 * 7)

        return item


    # =================== LẤY GIỎ HÀNG CỦA BUYER (REDIS) =======================
    async def get_buyer_cart(self, buyer_id: int):
        # ===== 1. Lấy cart từ Redis =====
        cart_key = self._cart_key(buyer_id)
        raw_items = await self.redis.hgetall(cart_key)
        
        if not raw_items:
            return []

        # Parse JSON từ Redis
        cart_items = [json.loads(v) for v in raw_items.values()]
        product_ids = {item["product_id"] for item in cart_items}

        # ===== 2. Lấy thông tin sản phẩm + relations từ DB =====
        stmt = (
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.sizes),
                selectinload(Product.seller),
            )
            .where(Product.product_id.in_(product_ids))
        )
        result = await self.db.execute(stmt)
        products = result.scalars().all()
        product_map = {p.product_id: p for p in products}

        # ===== 3. Map cart item với product info =====
        grouped: dict[str, list] = defaultdict(list)

        for item in cart_items:
            product = product_map.get(item["product_id"])
            if not product:
                continue

            seller = product.seller
            seller_name = seller.shop_name if seller else "Unknown Seller"

            image_url = (
                public_url(product.images[0].image_url) if product.images else None
            )

            variant = next(
                (v for v in product.variants if v.variant_id == item.get("variant_id")),
                None
            )

            size = (
                next((s for s in variant.sizes if s.size_id == item.get("size_id")), None)
                if variant else None
            )

            # Giá bán sau discount
            base_price = product.base_price + (variant.price_adjustment if variant else 0)
            sale_price = base_price * (100 - product.discount_percent) / 100

            unit_weight = float(product.weight or 0)
            total_weight = unit_weight * item["quantity"]

            grouped[seller_name].append(
                {
                    "product_id": product.product_id,
                    "name": product.name,

                    "variant_id": variant.variant_id if variant else None,
                    "variant_name": variant.variant_name if variant else None,

                    "size_id": size.size_id if size else None,
                    "size_name": size.size_name if size else None,

                    "quantity": item["quantity"],
                    "price": float(sale_price),

                    "weight": unit_weight,
                    "total_weight": total_weight,

                    "public_image_url": image_url,
                }
            )

        # ===== 4. Trả về dạng nhóm theo seller =====
        return [
            {"seller": seller_name, "products": products}
            for seller_name, products in grouped.items()
        ]

    # =================== XÓA SẢN PHẨM KHỎI GIỎ HÀNG =======================
    async def delete_item(
        self,
        buyer_id: int,
        product_id: int,
        variant_id: int | None = None,
        size_id: int | None = None,
    ):
        cart_key = self._cart_key(buyer_id)
        item_key = self._item_key(product_id, variant_id, size_id)

        exists = await self.redis.hexists(cart_key, item_key)
        if not exists:
            raise HTTPException(404, "Item not found in cart")

        await self.redis.hdel(cart_key, item_key)

        return {"message": "Item removed successfully"}

     # =================== TÍNH TỔNG TIỀN GIỎ HÀNG =======================
    async def cart_total(
        self,
        buyer_id: int,
        selected_items: Optional[list[CartItemKey]] = None,
    ):
        cart_key = self._cart_key(buyer_id)
        raw_items = await self.redis.hgetall(cart_key)
        if not raw_items:
            return {"subtotal": 0, "total_items": 0}

        subtotal = 0
        total_items = 0

        for raw_key, raw in raw_items.items():
            item = json.loads(raw)

            # Nếu có lọc selected_items
            if selected_items:
                match = False
                for si in selected_items:
                    if self._item_key(si.product_id, si.variant_id, si.size_id) == raw_key:
                        match = True
                        break
                if not match:
                    continue

            subtotal += item["price"] * item["quantity"]
            total_items += item["quantity"]

        return {"subtotal": subtotal, "total_items": total_items}

    # =================== CẬP NHẬT SỐ LƯỢNG =======================
    async def update_quantity(self, buyer_id: int, data: UpdateCartItemRequest):
        """
        Cập nhật số lượng sản phẩm trong giỏ hàng Redis.
        FE gửi: product_id, variant_id, size_id, action hoặc quantity
        action: "increase" / "decrease"
        quantity: số lượng mới (tùy chọn)
        """

        # 1. Lấy cart key
        cart_key = self._cart_key(buyer_id)
        
        # 2. Tạo item key từ product/variant/size
        item_key = self._item_key(data.product_id, data.variant_id, data.size_id)

        # 3. Lấy item từ Redis
        raw = await self.redis.hget(cart_key, item_key)
        if not raw:
            raise HTTPException(404, "Item not found in cart")

        item = json.loads(raw)

        # 4. Update quantity
        if data.action == "increase":
            item["quantity"] += 1
        elif data.action == "decrease":
            if item["quantity"] > 1:
                item["quantity"] -= 1
            else:
                raise HTTPException(400, "Quantity must be > 0")
        elif data.quantity is not None:
            if data.quantity <= 0:
                raise HTTPException(400, "Quantity must be > 0")
            item["quantity"] = data.quantity
        else:
            raise HTTPException(400, "No valid action or quantity provided")

        # 5. Lưu lại Redis
        await self.redis.hset(cart_key, item_key, json.dumps(item))

        # 6. Trả về dữ liệu FE có thể dùng trực tiếp
        return {
            "message": "Item updated",
            "item": {
                "product_id": item["product_id"],
                "variant_id": item.get("variant_id"),
                "size_id": item.get("size_id"),
                "quantity": item["quantity"],
            }
        }
    # =================== CẬP NHẬT VARIANT + SIZE (REDIS) =======================
    async def update_variant_size(self, buyer_id: int, data: UpdateVariantSizeRequest):
        """
        Cập nhật variant/size của item trong giỏ hàng Redis.
        FE gửi:
        - product_id, old_variant_id, old_size_id: xác định item cũ
        - new_variant_id, new_size_id: cập nhật item
        """

        # 1. Cart key và item_key cũ
        cart_key = self._cart_key(buyer_id)
        old_item_key = self._item_key(data.product_id, data.old_variant_id, data.old_size_id)

        # 2. Lấy item cũ
        raw = await self.redis.hget(cart_key, old_item_key)
        if not raw:
            raise HTTPException(404, "Item not found in cart")
        item = json.loads(raw)

        # 3. Cập nhật variant/size mới
        new_variant_id = data.new_variant_id or item.get("variant_id")
        new_size_id = data.new_size_id or item.get("size_id")

        # 4. Kiểm tra tồn kho (có thể từ DB hoặc cache khác)
        # TODO: kiểm tra ProductVariant + ProductSize hợp lệ và còn tồn kho
        # Nếu cần, có thể gọi service get_product_options(product_id)

        # 5. Tạo item_key mới
        new_item_key = self._item_key(data.product_id, new_variant_id, new_size_id)

        # 6. Merge nếu trùng item mới
        raw_new = await self.redis.hget(cart_key, new_item_key)
        if raw_new:
            new_item = json.loads(raw_new)
            new_item["quantity"] += item["quantity"]
        else:
            new_item = item.copy()
            new_item["variant_id"] = new_variant_id
            new_item["size_id"] = new_size_id

        # 7. Lưu vào Redis
        await self.redis.hset(cart_key, new_item_key, json.dumps(new_item))

        # 8. Xóa item cũ nếu khác key
        if old_item_key != new_item_key:
            await self.redis.hdel(cart_key, old_item_key)

        return {
            "message": "Item updated",
            "item": {
                "product_id": new_item["product_id"],
                "variant_id": new_item.get("variant_id"),
                "size_id": new_item.get("size_id"),
                "quantity": new_item["quantity"],
                "price": new_item.get("price"),
            }
        }



async def get_cart_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client),
):
    return CartServiceAsync(db, redis)