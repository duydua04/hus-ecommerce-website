from fastapi import HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from collections import defaultdict
from datetime import datetime
from typing import Optional
from decimal import Decimal
from ...schemas.product import ( UpdateCartItemRequest, UpdateVariantSizeRequest)
from ...models import (
    Product, ProductSize, ProductVariant, ShoppingCart, ShoppingCartItem
)
from ...config.s3 import public_url
from redis.asyncio import Redis
from ...config.db import get_db
from ...config.redis import get_redis_client
from sqlalchemy.orm import selectinload


class CartServiceAsync:
    def __init__(self, db: AsyncSession):
        self.db = db

    # =================== LẤY OPTION SẢN PHẨM =======================
    async def get_product_options(self, product_id: int):
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.variants).selectinload(ProductVariant.sizes))
            .where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(404, "Product not found")

        variants = []
        for v in product.variants or []:
            sizes = [
                {
                    "size_id": s.size_id,
                    "label": s.size_name,
                    "stock": s.available_units,
                    "in_stock": s.in_stock
                } for s in v.sizes or []
            ]
            variants.append({"variant_id": v.variant_id, "name": v.variant_name, "sizes": sizes})

        return {"product_id": product.product_id, "product_name": product.name, "variants": variants}

    # --- Tìm giỏ hàng của buyer ---
    async def find_cart(self, buyer_id: int):
        result = await self.db.execute(select(ShoppingCart).where(ShoppingCart.buyer_id == buyer_id))
        return result.scalar_one_or_none()

    # --- Thêm sản phẩm vào giỏ hàng ---
    async def add_to_cart(self, buyer_id: int, product_id: int, variant_id: int | None = None, size_id: int | None = None, quantity=1):
        cart = await self.find_cart(buyer_id)
        if not cart:
            cart = ShoppingCart(buyer_id=buyer_id)
            self.db.add(cart)
            await self.db.flush()
        # Kiểm tra variant
        if variant_id is not None:
            result = await self.db.execute(
                select(ProductVariant).where(
                    ProductVariant.variant_id == variant_id,
                    ProductVariant.product_id == product_id
                )
            )
            variant = result.scalar_one_or_none()
            if not variant:
                raise HTTPException(400, "Variant không hợp lệ")

        # Kiểm tra size
        if size_id is not None:
            result = await self.db.execute(
                select(ProductSize).where(
                    ProductSize.size_id == size_id,
                    ProductSize.variant_id == variant_id
            )
        )
        size = result.scalar_one_or_none()
        if not size:
            raise HTTPException(400, "Size không hợp lệ hoặc không thuộc variant này")
        # Kiểm tra item trùng
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
            self.db.add(
                ShoppingCartItem(
                    shopping_cart_id=cart.shopping_cart_id,
                    product_id=product_id,
                    variant_id=variant_id,
                    size_id=size_id,
                    quantity=quantity
                )
            )

        cart.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(cart)
        return cart


    # =================== LẤY GIỎ HÀNG CỦA BUYER =======================
    async def get_buyer_cart(self, buyer_id: int):
        cart = await self.find_cart(buyer_id)
        if not cart:
            return []

        # Lấy tất cả item với product + images + variants
        result = await self.db.execute(
            select(ShoppingCartItem)
            .options(
                joinedload(ShoppingCartItem.product)
                .joinedload(Product.images),
                joinedload(ShoppingCartItem.product)
                .joinedload(Product.variants)
                .joinedload(ProductVariant.sizes),
                joinedload(ShoppingCartItem.product)
                .joinedload(Product.seller)
            )
            .where(ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id)
        )
        items = result.unique().scalars().all()# tránh lỗi duplicate object

        grouped = defaultdict(list)
        for item in items:
            product = item.product
            seller_name = product.seller.shop_name if product.seller else "Unknown Seller"
            image_url = public_url(product.images[0].image_url) if product.images else None
            variant = next((v for v in product.variants if v.variant_id == item.variant_id), None)
            size = next((s for s in variant.sizes if s.size_id == item.size_id), None) if variant else None

            grouped[seller_name].append({
                "product_id": product.product_id,
                "name": product.name,
                "variant_id": variant.variant_id if variant else None,
                "variant_name": variant.variant_name if variant else None,
                "size_id": size.size_id if size else None,
                "size_name": size.size_name if size else None,
                "quantity": item.quantity,
                "price": float(product.base_price + (variant.price_adjustment if variant else 0)),
                "public_image_url": image_url
            })

        # Trả về dạng list JSON nhóm theo seller
        return [{"seller": seller, "products": products} for seller, products in grouped.items()]

    # =================== XÓA SẢN PHẨM KHỎI GIỎ HÀNG =======================
    async def delete_item(self, buyer_id: int, item_id: int):
        cart = await self.find_cart(buyer_id)
        if not cart:
            raise HTTPException(404, "Cart not found")

        result = await self.db.execute(
            select(ShoppingCartItem).where(
                ShoppingCartItem.shopping_cart_item_id == item_id,
                ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(404, "Item not found in cart")

        await self.db.delete(item)
        await self.db.commit()
        return {"message": "Item removed successfully"}


    # =================== TÍNH TỔNG TIỀN GIỎ HÀNG =======================
    async def cart_total(self, buyer_id: int, selected_item_ids: Optional[list[int]] = None):
        cart = await self.find_cart(buyer_id)
        if not cart:
            return {"subtotal": 0, "total_items": 0}

        result = await self.db.execute(
            select(ShoppingCartItem)
            .options(joinedload(ShoppingCartItem.product).joinedload(Product.variants))
            .where(ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id)
        )

        # fix duplicate object
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
            subtotal += (item.product.base_price + variant_adjust) * item.quantity
            total_items += item.quantity

        return {"subtotal": float(subtotal), "total_items": total_items}

    # =================== CẬP NHẬT SỐ LƯỢNG =======================
    async def update_quantity(self, buyer_id: int, item_id: int, data: UpdateCartItemRequest):
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
            raise HTTPException(404, "Item not found")

        if data.action == "increase":
            item.quantity += 1
        elif data.quantity is not None:
            if data.quantity <= 0:
                raise HTTPException(400, "Quantity must be > 0")
            item.quantity = data.quantity
        else:
            raise HTTPException(400, "No valid action or quantity provided")

        await self.db.commit()
        await self.db.refresh(item)
        return {"message": "Item updated", "item_id": item.shopping_cart_item_id, "new_quantity": item.quantity}

    # =================== CẬP NHẬT VARIANT + SIZE =======================
    async def update_variant_size(self, buyer_id: int, item_id: int, req: UpdateVariantSizeRequest):
        if not req.new_variant_id and not req.new_size_id:
            raise HTTPException(400, "No data to update")

        cart = await self.find_cart(buyer_id)
        if not cart:
            raise HTTPException(404, "Cart not found")

        result = await self.db.execute(
            select(ShoppingCartItem)
            .join(ShoppingCart)
            .where(
                ShoppingCartItem.shopping_cart_item_id == item_id,
                ShoppingCart.buyer_id == buyer_id
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(404, "Item not found or not owned by buyer")

        variant_id = req.new_variant_id or item.variant_id
        size_id = req.new_size_id or item.size_id
        product_id = item.product_id

        # Check variant
        result = await self.db.execute(select(ProductVariant).where(ProductVariant.variant_id == variant_id, ProductVariant.product_id == product_id))
        variant = result.scalar_one_or_none()
        if not variant:
            raise HTTPException(400, "Variant not valid")

        # Check size
        result = await self.db.execute(select(ProductSize).where(ProductSize.size_id == size_id, ProductSize.variant_id == variant_id))
        size = result.scalar_one_or_none()
        if not size:
            raise HTTPException(400, "Size not valid")
        if not size.in_stock or size.available_units < item.quantity:
            raise HTTPException(400, "Not enough stock")

        # Merge nếu trùng
        result = await self.db.execute(
            select(ShoppingCartItem).where(
                ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id,
                ShoppingCartItem.product_id == product_id,
                ShoppingCartItem.variant_id == variant_id,
                ShoppingCartItem.size_id == size_id,
                ShoppingCartItem.shopping_cart_item_id != item_id
            )
        )
        duplicate_item = result.scalar_one_or_none()
        if duplicate_item:
            duplicate_item.quantity += item.quantity
            await self.db.delete(item)
            await self.db.commit()
            await self.db.refresh(duplicate_item)
            return {"message": "Item merged", "item_id": duplicate_item.shopping_cart_item_id, "new_quantity": duplicate_item.quantity}

        # Update trực tiếp
        item.variant_id = variant_id
        item.size_id = size_id
        await self.db.commit()
        await self.db.refresh(item)
        return {"message": "Item updated", "item_id": item.shopping_cart_item_id, "variant_id": variant_id, "size_id": size_id}



def get_cart_service(db: AsyncSession = Depends(get_db)):
    return CartServiceAsync(db)