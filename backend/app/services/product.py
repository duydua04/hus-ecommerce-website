from __future__ import annotations
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List
from ..models.order import OrderItem
from ..models.catalog import Product, ProductSize, ProductVariant, ProductImage

from ..schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse,
    ProductSizeCreate, ProductSizeUpdate, ProductSizeResponse,
    ProductImageResponse
)

from ..services.storage_service import upload_many_via_backend, upload_via_backend, delete_object
from ..config.s3 import public_url, presign_get


def ensure_owner(db: Session, seller_id: int, product_id: int):
    # Kiem tra xem co product ung voi seller khong
    product = db.query(Product).filter(Product.product_id == product_id, Product.seller_id == seller_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return product

# Kiem tra xem san pham hien tai dang co don hang nao khong
def has_order_item(db: Session, product_id: int):
    return db.query(OrderItem.order_item_id).filter(OrderItem.product_id == product_id).first() is not None

def seller_create_product(db: Session, seller_id: int, payload: ProductCreate):
    # Ham selller tao san pham moi
    product = Product(
        name=payload.name,
        seller_id=payload.seller_id,
        base_price=payload.base_price,
        category_id=payload.category_id,
        description=payload.description,
        discount_percent=payload.discount_percent or 0,
        weight=payload.weight,
        is_active=True
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return ProductResponse.model_validate(product)
