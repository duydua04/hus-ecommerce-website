from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload, Query
from ...schemas.product import ProductResponse
from ...models import Product, ProductSize, ProductImage, ProductVariant
from sqlalchemy import and_
from typing import Optional
from enum import Enum
from ...models.cart import ShoppingCart, ShoppingCartItem
from datetime import datetime
from ...schemas.product import (
    ProductCreate,
    ProductDetail,
    ProductImageResponse,
    ProductList,
    ProductResponse,
    ProductSizeCreate,
    ProductSizeResponse,
    ProductSizeUpdate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
    ProductVariantWithSizesResponse,
)
from ...config.s3 import public_url
from sqlalchemy.orm import joinedload
from collections import defaultdict

# === LẤY RA THÔNG TIN ĐỂ NGƯỜI DÙNG CHỌN PHÂN LOẠI TRƯỚC KHI THÊM VÀO GIỎ HÀNG ===
def get_product_options(product_id: int, db: Session):
    """
    Lấy danh sách phân loại (variant), size, và số lượng tồn kho
    """
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    variant_list = []
    for v in product.variants:  # lặp qua variant
        sizes_list = [
            {"size_id": s.size_id, "label": s.size_name, "stock": s.available_units, "in_stock": s.in_stock}
            for s in v.sizes  # lấy size theo variant
        ]
        variant_list.append({
            "variant_id": v.variant_id,
            "name": v.variant_name,
            "sizes": sizes_list
        })

    return {
        "product_id": product.product_id,
        "product_name": product.name,
        "variants": variant_list
    }

# === THÊM SẢN PHẨM VÀO GIỎ HÀNG ====
def add_to_cart(db: Session, buyer_id: int, product_id: int, variant_id=None, size_id=None, quantity=1):
    """ 
    Thêm sản phẩm vào giỏ hàng. 
    Nếu giỏ hàng hoặc item chưa có thì tạo mới. 
    Nếu item đã tồn tại thì tăng số lượng. 
    """

    cart = db.query(ShoppingCart).filter_by(buyer_id=buyer_id).first()
    if not cart:
        cart = ShoppingCart(buyer_id=buyer_id)
        db.add(cart)
        db.flush()  # shopping_cart_id đã có

    # Kiểm tra variant/size và tồn kho
    size = None
    if size_id:
        size = db.query(ProductSize).filter_by(size_id=size_id).first()
        if not size:
            raise Exception("Size không tồn tại")
        if not size.in_stock or size.available_units < quantity:
            raise Exception("Số lượng vượt quá tồn kho")

    if variant_id:
        variant = db.query(ProductVariant).filter_by(variant_id=variant_id).first()
        if not variant:
            raise Exception("Variant không tồn tại")

    # Kiểm tra item trong giỏ
    existing_item = (
        db.query(ShoppingCartItem)
        .filter_by(
            shopping_cart_id=cart.shopping_cart_id,
            product_id=product_id,
            variant_id=variant_id,
            size_id=size_id,
        )
        .first()
    )

    if existing_item:
        new_qty = existing_item.quantity + quantity
        if size and new_qty > size.available_units:
            raise Exception("Không đủ hàng trong kho")
        existing_item.quantity = new_qty
    else:
        new_item = ShoppingCartItem(
            shopping_cart_id=cart.shopping_cart_id,
            product_id=product_id,
            variant_id=variant_id,
            size_id=size_id,
            quantity=quantity,
        )
        db.add(new_item)

    cart.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cart)
    return cart



# === HIỂN THỊ GIỎ HÀNG CỦA NGƯỜI DÙNG ===
def get_buyer_cart(buyer_id: int, db: Session):
    cart = db.query(ShoppingCart).filter_by(buyer_id=buyer_id).first()
    if not cart:
        return []

    items = (
        db.query(ShoppingCartItem)
        .join(Product)
        .join(ProductVariant, ShoppingCartItem.variant_id == ProductVariant.variant_id)
        .join(ProductSize, ShoppingCartItem.size_id == ProductSize.size_id)
        .options(
            joinedload(ShoppingCartItem.product).joinedload(Product.images),
            joinedload(ShoppingCartItem.product).joinedload(Product.seller),
        )
        .filter(ShoppingCartItem.shopping_cart_id == cart.shopping_cart_id)
        .all()
    )

    grouped = defaultdict(list)
    for item in items:
        seller_name = item.product.seller.shop_name if item.product.seller else "Unknown Seller"

        # Ảnh public của sản phẩm
        image_url = None
        if item.product.images and len(item.product.images) > 0:
            image_url = public_url(item.product.images[0].image_url)

        # Lấy đúng variant và size đã chọn trong giỏ hàng
        variant = next((v for v in item.product.variants if v.variant_id == item.variant_id), None)
        size = None
        if variant:
            size = next((s for s in variant.sizes if s.size_id == item.size_id), None)

        grouped[seller_name].append({
            "product_id": item.product.product_id,
            "name": item.product.name,
            "variant_id": variant.variant_id if variant else None,
            "variant_name": variant.variant_name if variant else None,
            "size_id": size.size_id if size else None,
            "size_name": size.size_name if size else None,
            "quantity": item.quantity,
            "price": float(item.product.base_price + (variant.price_adjustment if variant else 0)),
            "public_image_url": image_url
        })

    return [{"seller": k, "products": v} for k, v in grouped.items()]