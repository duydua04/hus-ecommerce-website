from fastapi import HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, desc, select, func, asc, cast, Numeric, or_
from sqlalchemy.orm import joinedload
from collections import defaultdict
from datetime import datetime
from typing import Optional
from decimal import Decimal


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
    
  
    async def find_cart(self, buyer_id: int) -> ShoppingCart | None:
        result = await self.db.execute(
            select(ShoppingCart).where(ShoppingCart.buyer_id == buyer_id)
        )
        return result.scalar_one_or_none()
 # =================== THÊM SẢN PHẨM VÀO GIỎ HÀNG =======================
    async def add_to_cart(
        self,
        buyer_id: int,
        product_id: int,
        variant_id: int | None = None,
        size_id: int | None = None,
        quantity: int = 1
    ):
        # Lấy hoặc tạo cart
        cart = await self.find_cart(buyer_id)
        if not cart:
            cart = ShoppingCart(buyer_id=buyer_id)
            self.db.add(cart)
            await self.db.flush()  # có cart.shopping_cart_id

        # Kiểm tra item trùng trong SQL
        result = await self.db.execute(
            select(ShoppingCartItem).where(
                ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id,
                ShoppingCartItem.product_id == product_id,
                ShoppingCartItem.variant_id == variant_id,
                ShoppingCartItem.size_id == size_id
            )
        )
        existing_item = result.scalar_one_or_none()

        if existing_item:
            existing_item.quantity += quantity
        else:
            existing_item = ShoppingCartItem(
                shopping_cart_id=cart.shopping_cart_id,
                product_id=product_id,
                variant_id=variant_id,
                size_id=size_id,
                quantity=quantity
            )
            self.db.add(existing_item)

        # Commit SQL để chắc chắn shopping_cart_item_id có giá trị
        cart.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(existing_item)
        await self.db.refresh(cart, attribute_names=["items"])

        # Cập nhật Redis (double-delete / write-through)
        cart_key = self._cart_key(buyer_id)
        item_key = self._item_key(product_id, variant_id, size_id)
        await self.redis.hdel(cart_key, item_key)  # xóa cache cũ

        # Tính giá snapshot
        product = await self.db.scalar(select(Product).where(Product.product_id == product_id))
        variant = None
        if variant_id:
            variant = await self.db.scalar(select(ProductVariant).where(ProductVariant.variant_id == variant_id))
        base_price = product.base_price + (variant.price_adjustment if variant else 0)
        sale_price = base_price * (100 - product.discount_percent) / 100

        redis_item = {
            "shopping_cart_item_id": existing_item.shopping_cart_item_id,
            "product_id": product_id,
            "variant_id": variant_id,
            "size_id": size_id,
            "quantity": existing_item.quantity,
            "price": float(sale_price),
            "added_at": int(time.time())
        }
        await self.redis.hset(cart_key, item_key, json.dumps(redis_item))
        await self.redis.expire(cart_key, 60 * 60 * 24 * 7)  # TTL 7 ngày

        # Trả về format API
        total_items = sum(item.quantity for item in cart.items)
        return {
            "message": f"Thêm {quantity} sản phẩm vào giỏ hàng thành công",
            "cart_id": cart.shopping_cart_id,
            "total_items": total_items
        }
    

   # =================== LẤY GIỎ HÀNG CỦA BUYER =======================
    async def get_buyer_cart(self, buyer_id: int):
        cart = await self.find_cart(buyer_id)
        if not cart:
            return []

        cart_key = self._cart_key(buyer_id)
        raw_items = await self.redis.hgetall(cart_key)
        cart_items = []

        if raw_items:
            # Redis còn dữ liệu
            for raw in raw_items.values():
                cart_items.append(json.loads(raw))
        else:
            # Redis trống -> load từ SQL và đồng bộ cache
            stmt = (
                select(ShoppingCartItem)
                .options(
                    joinedload(ShoppingCartItem.product)
                    .joinedload(Product.images),
                    joinedload(ShoppingCartItem.product)
                    .joinedload(Product.variants)
                    .joinedload(ProductVariant.sizes),
                    joinedload(ShoppingCartItem.product)
                    .joinedload(Product.seller),
                )
                .where(ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id)
            )
            result = await self.db.execute(stmt)
            items = result.unique().scalars().all()

            for item in items:
                base_price = item.product.base_price
                variant = next((v for v in item.product.variants if v.variant_id == item.variant_id), None)
                base_price += variant.price_adjustment if variant else 0
                sale_price = base_price * (100 - item.product.discount_percent) / 100

                # item đã có shopping_cart_item_id, chỉ cần commit trước
                redis_item = {
                    "shopping_cart_item_id": item.shopping_cart_item_id,
                    "product_id": item.product_id,
                    "variant_id": item.variant_id,
                    "size_id": item.size_id,
                    "quantity": item.quantity,
                    "price": float(sale_price),
                    "added_at": int(time.time())
                }

                item_key = self._item_key(item.product_id, item.variant_id, item.size_id)
                await self.redis.hset(cart_key, item_key, json.dumps(redis_item))
                cart_items.append(redis_item)

            await self.redis.expire(cart_key, 60 * 60 * 24 * 7)

        # ===== Map dữ liệu trả về FE =====
        grouped: dict[str, list] = defaultdict(list)
        for item in cart_items:
            product = await self.db.scalar(
                select(Product)
                .options(
                    joinedload(Product.images),
                    joinedload(Product.variants).joinedload(ProductVariant.sizes),
                    joinedload(Product.seller)
                )
                .where(Product.product_id == item["product_id"])
            )
            if not product:
                continue

            seller = product.seller
            seller_name = seller.shop_name if seller else "Unknown Seller"
            image_url = public_url(product.images[0].image_url) if product.images else None
            variant = next((v for v in product.variants if v.variant_id == item.get("variant_id")), None)
            size = next((s for s in variant.sizes if s.size_id == item.get("size_id")), None) if variant else None

            base_price = product.base_price + (variant.price_adjustment if variant else 0)
            sale_price = base_price * (100 - product.discount_percent) / 100

            unit_weight = float(product.weight or 0)
            total_weight = unit_weight * item["quantity"]

            grouped[seller_name].append({
                "shopping_cart_item_id": item.get("shopping_cart_item_id"),
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
                "public_image_url": image_url
            })

        return [{"seller": seller_name, "products": products} for seller_name, products in grouped.items()]
    # =================== XÓA SẢN PHẨM KHỎI GIỎ HÀNG =======================
    async def delete_item(self, buyer_id: int, item_id: int):
        # Lấy cart
        cart = await self.find_cart(buyer_id)
        if not cart:
            raise HTTPException(404, "Cart not found")

        # Lấy item từ SQL
        result = await self.db.execute(
            select(ShoppingCartItem).where(
                ShoppingCartItem.shopping_cart_item_id == item_id,
                ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(404, "Item not found in cart")

        # Xóa SQL
        await self.db.delete(item)
        await self.db.commit()

        # Xóa khỏi Redis (double-delete)
        cart_key = self._cart_key(buyer_id)
        item_key = self._item_key(item.product_id, item.variant_id, item.size_id)
        await self.redis.hdel(cart_key, item_key)

        # Lấy lại giỏ hàng mới để trả về (format chuẩn)
        cart_data = await self.get_buyer_cart(buyer_id)
        return {
            "message": "Item removed successfully"
        }

     # =================== TÍNH TỔNG TIỀN GIỎ HÀNG =======================
    async def cart_total(self, buyer_id: int, selected_item_ids: Optional[list[int]] = None):
        """
        Tính tổng tiền giỏ hàng dựa trên Redis nếu có, fallback SQL nếu Redis trống.
        selected_item_ids: danh sách shopping_cart_item_id cần tính.
        """
        cart = await self.find_cart(buyer_id)
        if not cart:
            return {"subtotal": 0, "total_items": 0}

        # Thử lấy từ Redis
        cart_key = self._cart_key(buyer_id)
        raw_items = await self.redis.hgetall(cart_key)
        cart_items = []

        if raw_items:
            for raw in raw_items.values():
                cart_items.append(json.loads(raw))
        else:
            # Redis trống -> load từ SQL và đồng bộ cache
            stmt = (
                select(ShoppingCartItem)
                .options(
                    joinedload(ShoppingCartItem.product).joinedload(Product.variants)
                )
                .where(ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id)
            )
            result = await self.db.execute(stmt)
            items = result.unique().scalars().all()

            for item in items:
                variant = next((v for v in item.product.variants if v.variant_id == item.variant_id), None)
                base_price = item.product.base_price + (variant.price_adjustment if variant else 0)
                
                redis_item = {
                    "shopping_cart_item_id": item.shopping_cart_item_id,
                    "product_id": item.product_id,
                    "variant_id": item.variant_id,
                    "size_id": item.size_id,
                    "quantity": item.quantity,
                    "price": float(base_price),
                    "added_at": int(time.time())
                }

                item_key = self._item_key(item.product_id, item.variant_id, item.size_id)
                await self.redis.hset(cart_key, item_key, json.dumps(redis_item))
                cart_items.append(redis_item)

            await self.redis.expire(cart_key, 60 * 60 * 24 * 7)

        # Lọc theo selected_item_ids nếu có
        if selected_item_ids:
            cart_items = [i for i in cart_items if i["shopping_cart_item_id"] in selected_item_ids]

        # Tính subtotal và tổng số lượng
        subtotal = Decimal(0)
        total_items = 0
        for item in cart_items:
            subtotal += Decimal(item["price"]) * item["quantity"]
            total_items += item["quantity"]

        return {"subtotal": float(subtotal), "total_items": total_items}

    # =================== CẬP NHẬT SỐ LƯỢNG =======================
    async def update_quantity(self, buyer_id: int, item_id: int, data: "UpdateCartItemRequest"):
        """
        Cập nhật số lượng sản phẩm trong giỏ hàng và đồng bộ Redis.
        """
        cart = await self.find_cart(buyer_id)
        if not cart:
            raise HTTPException(404, "Cart not found")

        result = await self.db.execute(
            select(ShoppingCartItem).where(
                ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id,
                ShoppingCartItem.shopping_cart_item_id == item_id
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(404, "Item not found in cart")

        # ===== Thay đổi số lượng =====
        if data.action == "increase":
            item.quantity += 1
        elif data.action == "decrease":
            if item.quantity > 1:
                item.quantity -= 1
            else:
                raise HTTPException(400, "Quantity must be > 0")
        elif data.quantity is not None:
            if data.quantity <= 0:
                raise HTTPException(400, "Quantity must be > 0")
            item.quantity = data.quantity
        else:
            raise HTTPException(400, "No valid action or quantity provided")

        # Commit SQL
        await self.db.commit()
        await self.db.refresh(item)

        # ===== Đồng bộ Redis (double-delete pattern) =====
        cart_key = self._cart_key(buyer_id)
        item_key = self._item_key(item.product_id, item.variant_id, item.size_id)

        # Xóa cache cũ
        await self.redis.hdel(cart_key, item_key)

        # Tính giá snapshot
        product = await self.db.scalar(
            select(Product).where(Product.product_id == item.product_id)
        )
        variant = None
        if item.variant_id:
            variant = await self.db.scalar(
                select(ProductVariant).where(ProductVariant.variant_id == item.variant_id)
            )
        base_price = product.base_price + (variant.price_adjustment if variant else 0)
        sale_price = base_price * (100 - product.discount_percent) / 100

        # Ghi lại Redis
        redis_item = {
            "shopping_cart_item_id": item.shopping_cart_item_id,
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "size_id": item.size_id,
            "quantity": item.quantity,
            "price": float(sale_price),
            "added_at": int(time.time())
        }
        await self.redis.hset(cart_key, item_key, json.dumps(redis_item))
        await self.redis.expire(cart_key, 60 * 60 * 24 * 7)

        # ===== Trả về dữ liệu chuẩn =====
        return {
            "message": "Item updated successfully",
            "item_id": item.shopping_cart_item_id,
            "new_quantity": item.quantity
        }
    # =================== CẬP NHẬT VARIANT + SIZE (REDIS) =======================
    async def update_variant_size(
        self, 
        buyer_id: int, 
        item_id: int, 
        req: "UpdateVariantSizeRequest"
    ):
        """
        Cập nhật variant và size của sản phẩm trong giỏ hàng.
        - Kiểm tra tồn kho, hợp lệ với product.
        - Nếu trùng item, merge số lượng.
        - Đồng bộ Redis theo double-delete.
        """
        if not req.new_variant_id and not req.new_size_id:
            raise HTTPException(400, "No data to update")

        # ===== Tìm cart =====
        cart = await self.find_cart(buyer_id)
        if not cart:
            raise HTTPException(404, "Cart not found")

        # ===== Lấy item cần update, preload product + variants =====
        result = await self.db.execute(
            select(ShoppingCartItem)
            .options(
                selectinload(ShoppingCartItem.product).selectinload(Product.variants)
            )
            .join(ShoppingCart)
            .where(
                ShoppingCartItem.shopping_cart_item_id == item_id,
                ShoppingCart.buyer_id == buyer_id
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(404, "Item not found or not owned by buyer")

        # ===== Lấy variant/size mới =====
        variant_id = req.new_variant_id or item.variant_id
        size_id = req.new_size_id or item.size_id
        product_id = item.product_id

        # Check variant
        variant = next(
            (v for v in item.product.variants if v.variant_id == variant_id), None
        )
        if not variant:
            raise HTTPException(400, "Variant not valid")

        # Check size
        result = await self.db.execute(
            select(ProductSize)
            .where(ProductSize.size_id == size_id, ProductSize.variant_id == variant_id)
        )
        size = result.scalar_one_or_none()
        if not size:
            raise HTTPException(400, "Size not valid")
        if not size.in_stock or size.available_units < item.quantity:
            raise HTTPException(400, "Not enough stock")

        cart_key = self._cart_key(buyer_id)
        old_item_key = self._item_key(item.product_id, item.variant_id, item.size_id)

        # ===== Merge nếu trùng =====
        result = await self.db.execute(
            select(ShoppingCartItem)
            .options(
                selectinload(ShoppingCartItem.product).selectinload(Product.variants)
            )
            .where(
                ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id,
                ShoppingCartItem.product_id == product_id,
                ShoppingCartItem.variant_id == variant_id,
                ShoppingCartItem.size_id == size_id,
                ShoppingCartItem.shopping_cart_item_id != item_id
            )
        )
        duplicate_item = result.scalar_one_or_none()

        if duplicate_item:
            # Merge quantity
            duplicate_item.quantity += item.quantity
            await self.db.delete(item)
            await self.db.commit()
            await self.db.refresh(duplicate_item)

            # Double-delete Redis
            await self.redis.hdel(cart_key, old_item_key)

            # Ghi lại item mới vào Redis
            base_price = duplicate_item.product.base_price + (variant.price_adjustment if variant else 0)
            sale_price = base_price * (100 - duplicate_item.product.discount_percent) / 100
            new_item_key = self._item_key(duplicate_item.product_id, duplicate_item.variant_id, duplicate_item.size_id)
            redis_item = {
                "shopping_cart_item_id": duplicate_item.shopping_cart_item_id,
                "product_id": duplicate_item.product_id,
                "variant_id": duplicate_item.variant_id,
                "size_id": duplicate_item.size_id,
                "quantity": duplicate_item.quantity,
                "price": float(sale_price),
                "added_at": int(time.time())
            }
            await self.redis.hset(cart_key, new_item_key, json.dumps(redis_item))
            await self.redis.expire(cart_key, 60 * 60 * 24 * 7)

            return {
                "message": "Item merged",
                "item_id": duplicate_item.shopping_cart_item_id,
                "new_quantity": duplicate_item.quantity
            }

        # ===== Update trực tiếp =====
        item.variant_id = variant_id
        item.size_id = size_id
        await self.db.commit()
        await self.db.refresh(item)

        # Double-delete Redis
        await self.redis.hdel(cart_key, old_item_key)

        # Tính giá snapshot
        base_price = item.product.base_price + (variant.price_adjustment if variant else 0)
        sale_price = base_price * (100 - item.product.discount_percent) / 100

        new_item_key = self._item_key(item.product_id, item.variant_id, item.size_id)
        redis_item = {
            "shopping_cart_item_id": item.shopping_cart_item_id,
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "size_id": item.size_id,
            "quantity": item.quantity,
            "price": float(sale_price),
            "added_at": int(time.time())
        }
        await self.redis.hset(cart_key, new_item_key, json.dumps(redis_item))
        await self.redis.expire(cart_key, 60 * 60 * 24 * 7)

        return {
            "message": "Item updated",
            "item_id": item.shopping_cart_item_id,
            "variant_id": variant_id,
            "size_id": size_id
        }


async def get_cart_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client),
):
    return CartServiceAsync(db, redis)

