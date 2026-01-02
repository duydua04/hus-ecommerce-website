import json, asyncio
from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, Depends
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from ...config.db import get_db
from redis.asyncio import Redis
from ...config.redis import get_redis_client
from ...config.s3 import public_url
from ...models import Product, ProductVariant, ProductSize, ShoppingCart, ShoppingCartItem, Seller
from ...schemas.product import UpdateCartItemRequest, UpdateVariantSizeRequest


class CartServiceAsync:
    CART_TTL = 3600  # 1 giờ
    DELAY_DELETE = 0.5  # Khoảng trễ để xóa cache lần 2 (giây)
    EMPTY_CART_TTL = 300  # 5 phút cho giỏ hàng rỗng để tránh cache penetration
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis

    # =================== REDIS KEYS HELPER ===================
    def _cart_key(self, buyer_id: int):
        return f"cart:{buyer_id}"

    def _item_key(self, product_id: int, variant_id: Optional[int], size_id: Optional[int]):
        return f"{product_id}:{variant_id}:{size_id}"

    # =================== PATTERN: DOUBLE DELETE CACHE ===================
    async def _clear_cache(self, buyer_id: int):
        """Xóa cache lần 1 (Trước khi update DB)"""
        await self.redis.delete(self._cart_key(buyer_id))

    async def _double_delete_cache(self, buyer_id: int):
        """Xóa cache lần 2 (Sau khi update DB)"""
        await asyncio.sleep(self.DELAY_DELETE)
        await self.redis.delete(self._cart_key(buyer_id))

    def _format_price(self, amount: Decimal) -> float:
        # Quy đổi Decimal sang float sau khi đã làm tròn để đảm bảo chính xác
        return float(amount.quantize(Decimal('0.01')))

    # =================== GIỎ HÀNG: CÁC CHỨC NĂNG CHÍNH ===================
    async def _update_cart_cache(self, buyer_id: int):
        cart_stmt = select(ShoppingCart).where(ShoppingCart.buyer_id == buyer_id)
        cart_res = await self.db.execute(cart_stmt)
        cart = cart_res.scalar_one_or_none()
        
        # --- Tối ưu Lỗi 5: Chống Cache Penetration ---
        if not cart:
            # Lưu giá trị rỗng vào Redis với TTL ngắn thay vì chỉ xóa cache
            await self.redis.set(self._cart_key(buyer_id), json.dumps([]), ex=self.EMPTY_CART_TTL)
            return []

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
             # Lưu mảng rỗng vào redis để tránh query DB liên tục
             await self.redis.set(self._cart_key(buyer_id), json.dumps([]), ex=self.EMPTY_CART_TTL)
             return []

        grouped = defaultdict(list)
        for item in items:
            product = item.product
            seller_name = product.seller.shop_name if product.seller else "Unknown Seller"
            variant = next((v for v in product.variants if v.variant_id == item.variant_id), None)
            size = next((s for s in variant.sizes if s.size_id == item.size_id), None) if variant else None

            # Tính toán bằng Decimal để tránh sai số (Lỗi 6)
            base_price = Decimal(str(product.base_price)) + Decimal(str(variant.price_adjustment if variant else 0))
            discount = Decimal(str(product.discount_percent))
            sale_price = base_price * (Decimal('100') - discount) / Decimal('100')
            
            unit_weight = float(product.weight or 0)
            total_weight = unit_weight * item.quantity
            image_url = public_url(product.images[0].image_url) if product.images else None
            grouped[seller_name].append({
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

        final_response = [{"seller": seller, "products": products} for seller, products in grouped.items()]
        await self.redis.set(self._cart_key(buyer_id), json.dumps(final_response), ex=self.CART_TTL)
        return final_response

    # =================== LẤY GIỎ HÀNG ===================
    async def get_buyer_cart(self, buyer_id: int):
        key = self._cart_key(buyer_id)
        cached = await self.redis.get(key)
        
        if cached:
            items = json.loads(cached)
        else:
            items = await self._update_cart_cache(buyer_id)

        # Logic hiển thị phân nhóm theo seller (nếu dữ liệu cache chưa đúng format)
        if items and "seller" in items[0]:
            return items

        grouped = defaultdict(list)
        for item in items:
            seller = item.get("seller_name", "Unknown Seller")
            grouped[seller].append(item)

        return [
            {"seller": seller, "products": products}
            for seller, products in grouped.items()
        ]

    # =================== THÊM SẢN PHẨM VÀO GIỎ HÀNG ===================
    async def add_to_cart(self, buyer_id: int, product_id: int, variant_id: Optional[int] = None, size_id: Optional[int] = None, quantity: int = 1):
        # [DOUBLE DELETE - LẦN 1]
        await self._clear_cache(buyer_id)

        # --- Tối ưu Lỗi 4: Kiểm tra tồn kho trước khi thêm ---
        if size_id:
            size_stmt = select(ProductSize).where(ProductSize.size_id == size_id)
            size_res = await self.db.execute(size_stmt)
            size_obj = size_res.scalar_one_or_none()
            
            if not size_obj or size_obj.available_units < quantity:
                raise HTTPException(400, detail=f"Sản phẩm không đủ tồn kho (Còn lại: {size_obj.available_units if size_obj else 0})")

        # [DATABASE UPDATE]
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
            # Kiểm tra tồn kho lần nữa cho trường hợp cộng dồn
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

        # [DOUBLE DELETE - LẦN 2]
        asyncio.create_task(self._double_delete_cache(buyer_id))
        
        # Re-sync Cache
        await self._update_cart_cache(buyer_id)
        cart_items = await self.get_buyer_cart(buyer_id)
        total_items = sum(p["quantity"] for group in cart_items for p in group["products"])

        return {"message": f"Added {quantity} items", "cart_id": cart.shopping_cart_id, "total_items": total_items}

    # =================== XÓA ITEM ===================
    async def delete_item(self, buyer_id: int, item_id: int):
        # [DOUBLE DELETE - LẦN 1]
        await self._clear_cache(buyer_id)

        # [DATABASE UPDATE]
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

        # [DOUBLE DELETE - LẦN 2]
        asyncio.create_task(self._double_delete_cache(buyer_id))

        await self._update_cart_cache(buyer_id)
        return {"message": "Item removed successfully"}

    # =================== CẬP NHẬT SỐ LƯỢNG (Xử lý Quantity = 0) =======================
    async def update_quantity(self, buyer_id: int, item_id: int, data: UpdateCartItemRequest):
        # [DELETE 1]
        await self._clear_cache(buyer_id)

        # Query lấy item và thông tin liên quan
        stmt = (
            select(ShoppingCartItem)
            .where(ShoppingCartItem.shopping_cart_item_id == item_id)
        )
        res = await self.db.execute(stmt)
        item = res.scalar_one_or_none()
        
        if not item: 
            raise HTTPException(404, "Item not found")

        # Tính toán số lượng mới
        new_qty = item.quantity
        if data.action == "increase": 
            new_qty += 1
        elif data.action == "decrease": 
            new_qty -= 1
        elif data.quantity is not None: 
            new_qty = data.quantity

        # --- XỬ LÝ KHI SỐ LƯỢNG <= 0 ---
        if new_qty <= 0:
            # Thay vì báo lỗi, ta thực hiện xóa item này luôn
            await self.db.delete(item)
            await self.db.commit()
            
            # [DELETE 2]
            asyncio.create_task(self._double_delete_cache(buyer_id))
            await self._update_cart_cache(buyer_id)
            
            return {"message": "Item removed from cart", "item_id": item_id, "new_quantity": 0}

        # --- KIỂM TRA TỒN KHO ---
        if item.size_id:
            size_obj = await self.db.get(ProductSize, item.size_id)
            if size_obj and size_obj.available_units < new_qty:
                raise HTTPException(400, f"Không đủ hàng (Còn lại: {size_obj.available_units})")

        # Cập nhật số lượng bình thường
        item.quantity = new_qty
        await self.db.commit()
        
        # [DELETE 2]
        asyncio.create_task(self._double_delete_cache(buyer_id))

        # Đồng bộ lại cache và trả về dữ liệu mới
        await self._update_cart_cache(buyer_id)
        return {"message": "Item updated", "item_id": item.shopping_cart_item_id, "new_quantity": item.quantity}

    # =================== CẬP NHẬT VARIANT/_SIZE ===================
    async def update_variant_size(self, buyer_id: int, item_id: int, req: UpdateVariantSizeRequest):
        if not req.new_variant_id and not req.new_size_id:
            raise HTTPException(400, "No data to update")

        # [DOUBLE DELETE - LẦN 1]
        await self._clear_cache(buyer_id)

        # [DATABASE UPDATE]
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
            res_v = await self.db.execute(select(ProductVariant).where(ProductVariant.variant_id == variant_id, ProductVariant.product_id == product_id))
            if not res_v.scalar_one_or_none(): raise HTTPException(400, "Variant không hợp lệ")

        if size_id is not None:
            res_s = await self.db.execute(select(ProductSize).where(ProductSize.size_id == size_id, ProductSize.variant_id == variant_id))
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
            
            # [DOUBLE DELETE - LẦN 2]
            asyncio.create_task(self._double_delete_cache(buyer_id))
            await self._update_cart_cache(buyer_id)
            return {"message": "Item merged", "item_id": duplicate_item.shopping_cart_item_id, "new_quantity": duplicate_item.quantity}

        item.variant_id = variant_id
        item.size_id = size_id
        await self.db.commit()

        # [DOUBLE DELETE - LẦN 2]
        asyncio.create_task(self._double_delete_cache(buyer_id))

        await self._update_cart_cache(buyer_id)
        return {"message": "Item updated", "item_id": item.shopping_cart_item_id, "variant_id": variant_id, "size_id": size_id}

    # =================== TÍNH TỔNG ===================
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