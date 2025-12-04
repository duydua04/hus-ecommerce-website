from __future__ import annotations
from typing import List, Optional
from abc import ABC

from fastapi import HTTPException, UploadFile, status, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

# Config & Utils
from ...config.db import get_db
from ...config.s3 import public_url
from ...utils.storage import storage

# Models
from ...models.catalog import Category, Product, ProductImage, ProductSize, ProductVariant
from ...models.order import OrderItem

# Schemas
from ...schemas.common import Page, PageMeta
from ...schemas.product import (
    ProductCreate, ProductDetail, ProductImageResponse, ProductList, ProductResponse,
    ProductSizeCreate, ProductSizeResponse, ProductSizeUpdate, ProductUpdate,
    ProductVariantCreate, ProductVariantResponse, ProductVariantUpdate, ProductVariantWithSizesResponse,
)


class SellerBaseProductService(ABC):
    def __init__(self, db: Session):
        self.db = db

    def _ensure_product_ownership(self, seller_id: int, product_id: int) -> Product:
        """Đảm bảo sản phẩm thuộc về Seller"""

        product = self.db.query(Product).filter(
            Product.product_id == product_id,
            Product.seller_id == seller_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product


    def _ensure_variant_ownership(self, product_id: int, variant_id: int) -> ProductVariant:
        variant = self.db.query(ProductVariant).filter(
            ProductVariant.variant_id == variant_id,
            ProductVariant.product_id == product_id
        ).first()
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Variant not found"
            )

        return variant

    def _ensure_size_ownership(self, variant_id: int, size_id: int) -> ProductSize:
        size = self.db.query(ProductSize).filter(
            ProductSize.size_id == size_id,
            ProductSize.variant_id == variant_id
        ).first()

        if not size:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Size not found"
            )

        return size

    def _has_orders(self, model_id: int, id_type: str) -> bool:
        """Kiểm tra ràng buộc khóa ngoại với Order"""
        query = self.db.query(OrderItem.order_item_id)

        if id_type == 'product':
            query = query.filter(OrderItem.product_id == model_id)
        elif id_type == 'variant':
            query = query.filter(OrderItem.variant_id == model_id)
        elif id_type == 'size':
            query = query.filter(OrderItem.size_id == model_id)

        return query.first() is not None


    def _get_category_name(self, category_id: Optional[int]):
        if not category_id:
            return None

        return self.db.query(Category.category_name).filter(Category.category_id == category_id).scalar()

    def _get_product_images(self, product_id: int):
        images = self.db.query(ProductImage).filter(ProductImage.product_id == product_id) \
            .order_by(ProductImage.is_primary.desc(), ProductImage.product_image_id.asc()).all()

        return [
            ProductImageResponse(
                product_image_id=img.product_image_id,
                product_id=img.product_id,
                image_url=img.image_url,
                public_image_url=public_url(img.image_url),
                is_primary=img.is_primary
            ) for img in images
        ]

    def _get_product_variants(self, product_id: int):
        variants = self.db.query(ProductVariant).options(joinedload(ProductVariant.sizes)) \
            .filter(ProductVariant.product_id == product_id).order_by(ProductVariant.variant_id.asc()).all()

        result = []
        for v in variants:
            sorted_sizes = sorted(v.sizes or [], key=lambda x: x.size_id)
            result.append(ProductVariantWithSizesResponse(
                variant_id=v.variant_id, product_id=v.product_id,
                variant_name=v.variant_name, price_adjustment=v.price_adjustment,
                sizes=[ProductSizeResponse.model_validate(s) for s in sorted_sizes]
            ))

        return result