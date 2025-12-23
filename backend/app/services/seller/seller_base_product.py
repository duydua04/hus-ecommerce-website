from __future__ import annotations
from typing import Optional
from abc import ABC

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from ...config.s3 import public_url

from ...models.catalog import Category, Product, ProductImage, ProductSize, ProductVariant
from ...models.order import OrderItem

from ...schemas.product import (
    ProductImageResponse, ProductSizeResponse,
   ProductVariantWithSizesResponse,
)


class SellerBaseProductService(ABC):
    def __init__(self, db: AsyncSession):
        self.db = db


    async def _ensure_product_ownership(self, seller_id: int, product_id: int):
        """Đảm bảo sản phẩm thuộc về Seller"""
        stmt = select(Product).where(
            Product.product_id == product_id,
            Product.seller_id == seller_id
        )
        result = await self.db.execute(stmt)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product


    async def _ensure_variant_ownership(self, product_id: int, variant_id: int) -> ProductVariant:
        stmt = select(ProductVariant).where(
            ProductVariant.variant_id == variant_id,
            ProductVariant.product_id == product_id
        )
        result = await self.db.execute(stmt)
        variant = result.scalar_one_or_none()

        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Variant not found"
            )

        return variant


    async def _ensure_size_ownership(self, variant_id: int, size_id: int):
        stmt = select(ProductSize).where(
            ProductSize.size_id == size_id,
            ProductSize.variant_id == variant_id
        )
        result = await self.db.execute(stmt)
        size = result.scalar_one_or_none()

        if not size:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Size not found"
            )

        return size


    async def _has_orders(self, model_id: int, id_type: str):
        """Kiểm tra ràng buộc khóa ngoại với Order"""
        stmt = select(OrderItem.order_item_id)

        if id_type == 'product':
            stmt = stmt.where(OrderItem.product_id == model_id)
        elif id_type == 'variant':
            stmt = stmt.where(OrderItem.variant_id == model_id)
        elif id_type == 'size':
            stmt = stmt.where(OrderItem.size_id == model_id)

        # Limit 1 để tối ưu performance khi check tồn tại
        stmt = stmt.limit(1)
        result = await self.db.execute(stmt)

        return result.first() is not None


    async def _get_category_name(self, category_id: Optional[int]):
        if not category_id:
            return None

        stmt = select(Category.category_name).where(Category.category_id == category_id)
        result = await self.db.execute(stmt)

        return result.scalar()


    async def _get_product_images(self, product_id: int):
        stmt = (
            select(ProductImage)
            .where(ProductImage.product_id == product_id)
            .order_by(ProductImage.is_primary.desc(), ProductImage.product_image_id.asc())
        )
        result = await self.db.execute(stmt)
        images = result.scalars().all()

        return [
            ProductImageResponse(
                product_image_id=img.product_image_id,
                product_id=img.product_id,
                image_url=img.image_url,
                public_image_url=public_url(img.image_url),
                is_primary=img.is_primary
            ) for img in images
        ]


    async def _get_product_variants(self, product_id: int):
        stmt = (
            select(ProductVariant)
            .options(selectinload(ProductVariant.sizes))
            .where(ProductVariant.product_id == product_id)
            .order_by(ProductVariant.variant_id.asc())
        )
        result = await self.db.execute(stmt)
        variants = result.scalars().all()

        result_list = []
        for v in variants:
            sorted_sizes = sorted(v.sizes or [], key=lambda x: x.size_id)

            result_list.append(ProductVariantWithSizesResponse(
                variant_id=v.variant_id,
                product_id=v.product_id,
                variant_name=v.variant_name,
                price_adjustment=v.price_adjustment,
                sizes=[ProductSizeResponse.model_validate(s) for s in sorted_sizes]
            ))

        return result_list