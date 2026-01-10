import json
from collections import defaultdict
from decimal import Decimal
from typing import Optional

from fastapi import Depends, HTTPException
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ...config.db import get_db
from ...config.redis import get_redis_client
from ...config.s3 import public_url
from ...models import (
    Product,
    ProductSize,
    ProductVariant,
    ShoppingCart,
    ShoppingCartItem,
)
from ...schemas.product import UpdateCartItemRequest, UpdateVariantSizeRequest


class CartServiceAsync:
    CART_TTL = 3600  # 1 giờ

    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis

    # =================== REDIS KEYS HELPER ===================
    def _cart_key(self, buyer_id: int):
        return f"cart:{buyer_id}"

    # =================== WRITE-THROUGH HELPER ===================
    async def _refresh_cart_cache(self, buyer_id: int):
        """
        Write-Through Strategy:
        1. Query DB lấy dữ liệu mới nhất.
        2. Tính toán/Transform dữ liệu.
        3. Ghi trực tiếp vào Redis.
        4. Trả về dữ liệu để response ngay lập tức.
        """
        cart_stmt = select(ShoppingCart).where(ShoppingCart.buyer_id == buyer_id)
        cart_res = await self.db.execute(cart_stmt)
        cart = cart_res.scalar_one_or_none()

        # --- Xử lý khi không có giỏ hàng ---
        if not cart:
            empty_cart = []
            await self.redis.set(self._cart_key(buyer_id), json.dumps(empty_cart), ex=self.CART_TTL)
            return empty_cart

        stmt = (
            select(ShoppingCartItem)
            .options(
                joinedload(ShoppingCartItem.product).joinedload(Product.images),
                joinedload(ShoppingCartItem.product).joinedload(Product.variants).joinedload(ProductVariant.sizes),
                joinedload(ShoppingCartItem.product).joinedload(Product.seller)
            )
            .where(ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id)
        )

        res = await self.db.execute(stmt)
        items = res.unique().scalars().all()

        if not items:
            empty_cart = []
            await self.redis.set(self._cart_key(buyer_id), json.dumps(empty_cart), ex=self.CART_TTL)
            return empty_cart

        # --- Logic gom nhóm Seller & Tính toán giá (Giữ nguyên) ---
        grouped = defaultdict(list)

        for item in items:
            product = item.product

            # 1. Lấy thông tin Seller
            seller_obj = product.seller
            seller_id = seller_obj.seller_id if seller_obj else 0
            seller_name = seller_obj.shop_name if seller_obj else "Unknown Seller"

            # 2. Lấy avt_url
            raw_avt = seller_obj.avt_url if seller_obj else None
            seller_avt = public_url(raw_avt) if raw_avt else None

            # 3. Tạo key gom nhóm
            seller_key = (seller_id, seller_name, seller_avt)

            # Logic tính toán giá và variant
            variant = next((v for v in product.variants if v.variant_id == item.variant_id), None)
            size = next((s for s in variant.sizes if s.size_id == item.size_id), None) if variant else None

            base_price = Decimal(str(product.base_price)) + Decimal(str(variant.price_adjustment if variant else 0))
            discount = Decimal(str(product.discount_percent))
            sale_price = base_price * (Decimal('100') - discount) / Decimal('100')

            unit_weight = float(product.weight or 0)
            total_weight = unit_weight * item.quantity
            image_url = public_url(product.images[0].image_url) if product.images else None

            grouped[seller_key].append({
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
                "public_image_url": image_url
            })

        final_response = [
            {
                "seller": {
                    "seller_id": s_id,
                    "shop_name": s_name,
                    "avt_url": s_avt
                },
                "products": products
            }
            for (s_id, s_name, s_avt), products in grouped.items()
        ]

        # WRITE TO REDIS
        await self.redis.set(self._cart_key(buyer_id), json.dumps(final_response), ex=self.CART_TTL)
        return final_response

    # =================== LẤY GIỎ HÀNG ===================
    async def get_buyer_cart(self, buyer_id: int):
        # Read-Through: Đọc Cache trước, nếu miss thì gọi refresh
        key = self._cart_key(buyer_id)
        cached = await self.redis.get(key)

        if cached:
            items = json.loads(cached)
            # Basic validation check
            if items and isinstance(items[0].get("seller"), dict):
                return items
            if isinstance(items, list) and not items:
                return items

        # Cache Miss -> Refresh
        return await self._refresh_cart_cache(buyer_id)

    # =================== THÊM SẢN PHẨM VÀO GIỎ HÀNG ===================
    async def add_to_cart(self, buyer_id: int, product_id: int, variant_id: Optional[int] = None,
                          size_id: Optional[int] = None, quantity: int = 1):
        # 1. Validation Logic
        size_obj = None
        if size_id:
            size_stmt = select(ProductSize).where(ProductSize.size_id == size_id)
            size_res = await self.db.execute(size_stmt)
            size_obj = size_res.scalar_one_or_none()

            if not size_obj or size_obj.available_units < quantity:
                raise HTTPException(400,
                                    detail=f"Sản phẩm không đủ tồn kho (Còn lại: {size_obj.available_units if size_obj else 0})")

        # 2. Database Update
        cart = await self.find_cart(buyer_id)
        if not cart:
            cart = ShoppingCart(buyer_id=buyer_id)
            self.db.add(cart)
            await self.db.flush()

        stmt = select(ShoppingCartItem).where(
            ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id,
            ShoppingCartItem.product_id == product_id,
            ShoppingCartItem.variant_id == variant_id,
            ShoppingCartItem.size_id == size_id
        )
        result = await self.db.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            # Kiểm tra tồn kho cộng dồn
            if size_id and size_obj.available_units < (item.quantity + quantity):
                raise HTTPException(400, detail="Tổng số lượng vượt quá tồn kho")
            item.quantity += quantity
        else:
            item = ShoppingCartItem(
                shopping_cart_id=cart.shopping_cart_id,
                product_id=product_id,
                variant_id=variant_id,
                size_id=size_id,
                quantity=quantity
            )
            self.db.add(item)

        await self.db.commit()

        # 3. Write-Through: Update Cache Immediately
        cart_items = await self._refresh_cart_cache(buyer_id)

        total_items = sum(p["quantity"] for group in cart_items for p in group["products"])
        return {"message": f"Added {quantity} items", "cart_id": cart.shopping_cart_id, "total_items": total_items}

    # =================== XÓA ITEM ===================
    async def delete_item(self, buyer_id: int, item_id: int):
        cart = await self.find_cart(buyer_id)
        if not cart:
            raise HTTPException(404, "Cart not found")

        stmt = select(ShoppingCartItem).where(
            ShoppingCartItem.shopping_cart_item_id == item_id,
            ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id
        )
        result = await self.db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(404, "Item not found")

        await self.db.delete(item)
        await self.db.commit()

        # Write-Through: Update Cache Immediately
        await self._refresh_cart_cache(buyer_id)
        return {"message": "Item removed successfully"}

    # =================== CẬP NHẬT SỐ LƯỢNG =======================
    async def update_quantity(self, buyer_id: int, item_id: int, data: UpdateCartItemRequest):
        stmt = (
            select(ShoppingCartItem)
            .where(ShoppingCartItem.shopping_cart_item_id == item_id)
        )
        res = await self.db.execute(stmt)
        item = res.scalar_one_or_none()

        if not item:
            raise HTTPException(404, "Item not found")

        new_qty = item.quantity
        if data.action == "increase":
            new_qty += 1
        elif data.action == "decrease":
            new_qty -= 1
        elif data.quantity is not None:
            new_qty = data.quantity

        # --- Xử lý quantity <= 0: Xóa item ---
        if new_qty <= 0:
            await self.db.delete(item)
            await self.db.commit()

            # Write-Through Update
            await self._refresh_cart_cache(buyer_id)
            return {"message": "Item removed from cart", "item_id": item_id, "new_quantity": 0}

        # --- Kiểm tra tồn kho ---
        if item.size_id:
            size_obj = await self.db.get(ProductSize, item.size_id)
            if size_obj and size_obj.available_units < new_qty:
                raise HTTPException(400, f"Không đủ hàng (Còn lại: {size_obj.available_units})")

        # Database Update
        item.quantity = new_qty
        await self.db.commit()

        # Write-Through: Update Cache Immediately
        await self._refresh_cart_cache(buyer_id)
        return {"message": "Item updated", "item_id": item.shopping_cart_item_id, "new_quantity": item.quantity}

    # =================== CẬP NHẬT VARIANT/SIZE ===================
    async def update_variant_size(self, buyer_id: int, item_id: int, req: UpdateVariantSizeRequest):
        if not req.new_variant_id and not req.new_size_id:
            raise HTTPException(400, "No data to update")

        cart = await self.find_cart(buyer_id)
        if not cart:
            raise HTTPException(404, "Cart not found")

        res_item = await self.db.execute(
            select(ShoppingCartItem).where(
                ShoppingCartItem.shopping_cart_item_id == item_id,
                ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id
            )
        )
        item = res_item.scalar_one_or_none()
        if not item:
            raise HTTPException(404, "Item not found")

        variant_id = req.new_variant_id or item.variant_id
        size_id = req.new_size_id or item.size_id
        product_id = item.product_id

        # Validation Logic
        if variant_id is not None:
            res_v = await self.db.execute(select(ProductVariant).where(ProductVariant.variant_id == variant_id,
                                                                       ProductVariant.product_id == product_id))
            if not res_v.scalar_one_or_none(): raise HTTPException(400, "Variant không hợp lệ")

        if size_id is not None:
            res_s = await self.db.execute(
                select(ProductSize).where(ProductSize.size_id == size_id, ProductSize.variant_id == variant_id))
            size_obj = res_s.scalar_one_or_none()
            if not size_obj or not size_obj.in_stock or size_obj.available_units < item.quantity:
                raise HTTPException(400, "Size không hợp lệ hoặc hết hàng")

        # Merge check
        res_dup = await self.db.execute(
            select(ShoppingCartItem).where(
                ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id,
                ShoppingCartItem.product_id == product_id,
                ShoppingCartItem.variant_id == variant_id,
                ShoppingCartItem.size_id == size_id,
                ShoppingCartItem.shopping_cart_item_id != item_id
            )
        )
        duplicate_item = res_dup.scalar_one_or_none()

        if duplicate_item:
            duplicate_item.quantity += item.quantity
            await self.db.delete(item)
            await self.db.commit()

            # Write-Through Update (Merge Case)
            await self._refresh_cart_cache(buyer_id)
            return {"message": "Item merged", "item_id": duplicate_item.shopping_cart_item_id,
                    "new_quantity": duplicate_item.quantity}

        # Normal Update
        item.variant_id = variant_id
        item.size_id = size_id
        await self.db.commit()

        # Write-Through Update (Normal Case)
        await self._refresh_cart_cache(buyer_id)
        return {"message": "Item updated", "item_id": item.shopping_cart_item_id, "variant_id": variant_id,
                "size_id": size_id}

    # =================== TÍNH TỔNG (Giữ nguyên) ===================
    async def cart_total(self, buyer_id: int, selected_item_ids: Optional[list[int]] = None):
        cart = await self.find_cart(buyer_id)
        if not cart:
            return {"subtotal": 0, "total_items": 0}

        stmt = (
            select(ShoppingCartItem)
            .options(joinedload(ShoppingCartItem.product).joinedload(Product.variants))
            .where(ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id)
        )
        result = await self.db.execute(stmt)
        items = result.unique().scalars().all()
        if selected_item_ids:
            items = [i for i in items if i.shopping_cart_item_id in selected_item_ids]

        subtotal = Decimal(0)
        total_items = 0
        for item in items:
            variant_adjust = 0
            variant = next((v for v in item.product.variants if v.variant_id == item.variant_id), None)
            if variant:
                variant_adjust = variant.price_adjustment

            base_price = item.product.base_price + variant_adjust
            sale_price = base_price * (100 - item.product.discount_percent) / 100

            subtotal += sale_price * item.quantity
            total_items += item.quantity

        return {"subtotal": float(subtotal), "total_items": total_items}

    # =================== Helpers ===================
    async def find_cart(self, buyer_id: int):
        stmt = select(ShoppingCart).where(ShoppingCart.buyer_id == buyer_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


def get_cart_service(db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis_client)):
    return CartServiceAsync(db, redis)