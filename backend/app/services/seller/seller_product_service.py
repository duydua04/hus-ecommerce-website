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
from .seller_base_product import SellerBaseProductService


class SellerProductService(SellerBaseProductService):

    def get_products(
            self, seller_id: int, search: str = None,
            active_only: bool = True, limit: int = 10,
            offset: int = 0
    ):
        q = self.db.query(Product) \
             .options(joinedload(Product.category)) \
             .filter(Product.seller_id == seller_id)

        if search and search.strip():
            q = q.filter(Product.name.ilike(f"%{search.strip()}%"))

        if active_only:
            q = q.filter(Product.is_active.is_(True))

        total = q.count()
        items = q.order_by(Product.product_id.desc()).limit(limit).offset(offset).all()

        product_ids = [p.product_id for p in items]
        primary_map = {}

        if product_ids:
            imgs = self.db.query(ProductImage.product_id, ProductImage.image_url) \
                .filter(ProductImage.product_id.in_(product_ids), ProductImage.is_primary.is_(True)).all()
            primary_map = {pid: url for pid, url in imgs}

        data = []
        for p in items:
            base = ProductResponse.model_validate(p)
            data.append(ProductList(
                **base.model_dump(),
                category_name=p.category.category_name if p.category else None,
                public_primary_image_url=public_url(primary_map.get(p.product_id))
            ))

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )


    def get_detail(self, seller_id: int, product_id: int):

        product = self._ensure_product_ownership(seller_id, product_id)

        return ProductDetail(
            product_id=product.product_id,
            name=product.name,
            base_price=product.base_price,
            category_id=product.category_id,
            category_name=self._get_category_name(product.category_id),
            description=product.description,
            discount_percent=product.discount_percent,
            weight=product.weight,
            is_active=product.is_active,
            created_at=product.created_at.isoformat() if product.created_at else None,
            images=self._get_product_images(product_id),
            variants=self._get_product_variants(product_id)
        )


    def create_product(self, seller_id: int, payload: ProductCreate):
        exist = self.db.query(Product.product_id).filter(
            Product.seller_id == seller_id, Product.name.ilike(f"%{payload.name.strip()}%")
        ).first()
        if exist:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product name exists"
            )

        product = Product(
            name=payload.name, seller_id=seller_id, base_price=payload.base_price,
            category_id=payload.category_id, description=payload.description,
            discount_percent=payload.discount_percent or 0, weight=payload.weight, is_active=True
        )

        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)

        return ProductResponse.model_validate(product)


    def update_product(self, seller_id: int, product_id: int, payload: ProductUpdate):
        product = self._ensure_product_ownership(seller_id, product_id)
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(product, k, v)

        self.db.commit()
        self.db.refresh(product)

        return ProductResponse.model_validate(product)


    def delete_product(self, seller_id: int, product_id: int):
        product = self._ensure_product_ownership(seller_id, product_id)
        if self._has_orders(product_id, 'product'):
            if product.is_active:
                product.is_active = False
                self.db.commit()
            return {"deleted": False, "soft_deleted": True, "product_id": product_id}

        self.db.delete(product)
        self.db.commit()

        return {"deleted": True, "soft_deleted": False, "product_id": product_id}


    def create_variant(self, seller_id: int, product_id: int, payload: ProductVariantCreate):
        self._ensure_product_ownership(seller_id, product_id)
        name = (payload.variant_name or "").strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name required"
            )

        dup = self.db.query(ProductVariant).filter(
            ProductVariant.product_id == product_id,
            func.lower(ProductVariant.variant_name) == name.lower()
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Variant exists"
            )

        variant = ProductVariant(product_id=product_id,
                                 variant_name=name,
                                 price_adjustment=payload.price_adjustment or 0
        )
        self.db.add(variant)
        self.db.commit()
        self.db.refresh(variant)

        return ProductVariantResponse.model_validate(variant)

    def update_variant(self, seller_id: int, product_id: int, variant_id: int, payload: ProductVariantUpdate):
        self._ensure_product_ownership(seller_id, product_id)
        variant = self._ensure_variant_ownership(product_id, variant_id)

        if payload.variant_name:
            name = payload.variant_name.strip()
            dup = self.db.query(ProductVariant).filter(
                ProductVariant.product_id == product_id,
                func.lower(ProductVariant.variant_name) == name.lower(),
                ProductVariant.variant_id != variant_id
            ).first()
            if dup:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Variant name exists"
                )

            variant.variant_name = name

        if payload.price_adjustment is not None:
            variant.price_adjustment = payload.price_adjustment

        try:
            self.db.commit()
            self.db.refresh(variant)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Integrity error"
            )

        return ProductVariantResponse.model_validate(variant)


    def delete_variant(self, seller_id: int, product_id: int, variant_id: int):
        self._ensure_product_ownership(seller_id, product_id)
        variant = self._ensure_variant_ownership(product_id, variant_id)
        if self._has_orders(variant_id, 'variant'):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Variant used in orders"
            )

        self.db.query(ProductSize).filter(ProductSize.variant_id == variant_id).delete()
        self.db.delete(variant)
        self.db.commit()

        return {"deleted": True, "variant_id": variant_id}


    def create_size(self, seller_id: int, product_id: int, variant_id: int, payload: ProductSizeCreate):
        self._ensure_product_ownership(seller_id, product_id)
        self._ensure_variant_ownership(product_id, variant_id)
        name = (payload.size_name or "").strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Size name required"
            )

        dup = self.db.query(ProductSize).filter(
            ProductSize.variant_id == variant_id,
            func.lower(ProductSize.size_name) == name.lower()
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Size exists"
            )

        avail = payload.available_units or 0
        in_stock = payload.in_stock if payload.in_stock is not None else (avail > 0)
        size = ProductSize(
            variant_id=variant_id,
            size_name=name,
            available_units=avail,
            in_stock=in_stock
        )

        self.db.add(size)
        self.db.commit()
        self.db.refresh(size)

        return ProductSizeResponse.model_validate(size)


    def update_size(self, seller_id: int, product_id: int, variant_id: int, size_id: int, payload: ProductSizeUpdate):
        self._ensure_product_ownership(seller_id, product_id)
        self._ensure_variant_ownership(product_id, variant_id)
        size = self._ensure_size_ownership(variant_id, size_id)

        if payload.size_name:
            name = payload.size_name.strip()
            dup = self.db.query(ProductSize).filter(
                ProductSize.variant_id == variant_id,
                func.lower(ProductSize.size_name) == name.lower(),
                ProductSize.size_id != size_id
            ).first()
            if dup:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Size exists"
                )

            size.size_name = name

        if payload.available_units is not None:
            size.available_units = payload.available_units
            if size.available_units == 0: size.in_stock = False

        if payload.in_stock is not None:
            size.in_stock = payload.in_stock
            if not size.in_stock: size.available_units = 0

        self.db.commit()
        self.db.refresh(size)

        return ProductSizeResponse.model_validate(size)


    def delete_size(self, seller_id: int, product_id: int, variant_id: int, size_id: int):
        self._ensure_product_ownership(seller_id, product_id)
        self._ensure_variant_ownership(product_id, variant_id)
        size = self._ensure_size_ownership(variant_id, size_id)

        if self._has_orders(size_id, 'size'):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Size used in orders"
            )

        self.db.delete(size)
        self.db.commit()

        return {"deleted": True}


    def get_variant_sizes(self, seller_id: int, product_id: int, variant_id: int):
        self._ensure_product_ownership(seller_id, product_id)
        self._ensure_variant_ownership(product_id, variant_id)
        sizes = self.db.query(ProductSize).filter(ProductSize.variant_id == variant_id).all()

        return [ProductSizeResponse.model_validate(s) for s in sizes]


    async def upload_images(self, seller_id: int, product_id: int, files: List[UploadFile],
                            primary_index: Optional[int] = None):
        self._ensure_product_ownership(seller_id, product_id)

        results = await storage.upload_many('products', files, max_size_mb=5)

        if primary_index is not None and 0 <= primary_index < len(results):
            self.db.query(ProductImage).filter(ProductImage.product_id == product_id).update({"is_primary": False})

        responses = []
        for idx, res in enumerate(results):
            is_pri = (primary_index is not None and idx == primary_index)
            img = ProductImage(product_id=product_id, image_url=res["object_key"], is_primary=is_pri)
            self.db.add(img)
            self.db.flush()
            responses.append(ProductImageResponse(
                product_image_id=img.product_image_id, product_id=img.product_id,
                image_url=img.image_url, public_image_url=public_url(img.image_url), is_primary=is_pri
            ))

        self.db.commit()
        return responses


    def set_primary_image(self, seller_id: int, product_id: int, image_id: int):
        self._ensure_product_ownership(seller_id, product_id)
        img = self.db.query(ProductImage).filter(
            ProductImage.product_image_id == image_id, ProductImage.product_id == product_id
        ).first()
        if not img:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )

        self.db.query(ProductImage).filter(ProductImage.product_id == product_id).update(
            {ProductImage.is_primary: False})
        img.is_primary = True
        self.db.commit()
        self.db.refresh(img)

        return ProductImageResponse(
            product_image_id=img.product_image_id, product_id=img.product_id,
            image_url=img.image_url, public_image_url=public_url(img.image_url), is_primary=True
        )


    def delete_image(self, seller_id: int, product_id: int, image_id: int):
        self._ensure_product_ownership(seller_id, product_id)
        img = self.db.query(ProductImage).filter(
            ProductImage.product_image_id == image_id, ProductImage.product_id == product_id
        ).first()
        if not img:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )

        was_primary = img.is_primary
        try:
            storage.delete_file(img.image_url)
        except:
            pass

        self.db.delete(img)
        self.db.commit()

        if was_primary:
            next_img = self.db.query(ProductImage).filter(ProductImage.product_id == product_id).order_by(
                ProductImage.product_image_id.asc()).first()
            if next_img:
                next_img.is_primary = True
                self.db.commit()
        return {"deleted": True, "id": image_id}


def get_seller_product_service(db: Session = Depends(get_db)):
    return SellerProductService(db)