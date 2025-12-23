from __future__ import annotations
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import func, select, update, delete

from ...config.db import get_db
from ...config.s3 import public_url
from ...utils.storage import storage

from ...models.catalog import Product, ProductImage, ProductSize, ProductVariant

from ...schemas.common import Page, PageMeta
from ...schemas.product import (
    ProductCreate, ProductDetail, ProductList, ProductResponse,
    ProductSizeCreate, ProductSizeResponse, ProductSizeUpdate, ProductUpdate,
    ProductVariantCreate, ProductVariantResponse, ProductVariantUpdate, ProductImageResponse,
)
from .seller_base_product import SellerBaseProductService


class SellerProductService(SellerBaseProductService):

    def __init__(self, db: AsyncSession):
        super().__init__(db)


    async def get_products(
            self, seller_id: int, search: str = None,
            active_only: bool = True, limit: int = 10,
            offset: int = 0
    ):
        # 1. Tạo Query cơ bản
        stmt = (
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.seller_id == seller_id)
        )

        if search and search.strip():
            stmt = stmt.where(Product.name.ilike(f"%{search.strip()}%"))

        if active_only:
            stmt = stmt.where(Product.is_active.is_(True))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Product.product_id.desc()).limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        items = result.scalars().all()

        product_ids = [p.product_id for p in items]
        primary_map = {}

        if product_ids:
            img_stmt = select(ProductImage.product_id, ProductImage.image_url).where(
                ProductImage.product_id.in_(product_ids),
                ProductImage.is_primary.is_(True)
            )
            img_res = await self.db.execute(img_stmt)
            primary_map = {pid: url for pid, url in img_res.all()}

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


    async def get_detail(self, seller_id: int, product_id: int):
        product = await self._ensure_product_ownership(seller_id, product_id)

        cat_name = await self._get_category_name(product.category_id)
        images = await self._get_product_images(product_id)
        variants = await self._get_product_variants(product_id)

        return ProductDetail(
            product_id=product.product_id,
            name=product.name,
            base_price=product.base_price,
            category_id=product.category_id,
            category_name=cat_name,
            description=product.description,
            discount_percent=product.discount_percent,
            weight=product.weight,
            is_active=product.is_active,
            created_at=product.created_at.isoformat() if product.created_at else None,
            images=images,
            variants=variants
        )

    async def create_product(self, seller_id: int, payload: ProductCreate):
        # Check trùng tên
        stmt = select(Product.product_id).where(
            Product.seller_id == seller_id,
            Product.name.ilike(f"%{payload.name.strip()}%")
        )
        if (await self.db.execute(stmt)).first():
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
        await self.db.commit()
        await self.db.refresh(product)

        return ProductResponse.model_validate(product)

    async def update_product(self, seller_id: int, product_id: int, payload: ProductUpdate):
        product = await self._ensure_product_ownership(seller_id, product_id)

        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(product, k, v)

        await self.db.commit()
        await self.db.refresh(product)

        return ProductResponse.model_validate(product)

    async def delete_product(self, seller_id: int, product_id: int):
        product = await self._ensure_product_ownership(seller_id, product_id)

        if await self._has_orders(product_id, 'product'):
            if product.is_active:
                product.is_active = False
                await self.db.commit()
            return {"deleted": False, "soft_deleted": True, "product_id": product_id}

        await self.db.delete(product)
        await self.db.commit()

        return {"deleted": True, "soft_deleted": False, "product_id": product_id}

    async def create_variant(self, seller_id: int, product_id: int, payload: ProductVariantCreate):
        await self._ensure_product_ownership(seller_id, product_id)
        name = (payload.variant_name or "").strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name required"
            )

        # Check trùng tên variant
        stmt = select(ProductVariant).where(
            ProductVariant.product_id == product_id,
            func.lower(ProductVariant.variant_name) == name.lower()
        )
        if (await self.db.execute(stmt)).scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Variant exists"
            )

        variant = ProductVariant(
            product_id=product_id,
            variant_name=name,
            price_adjustment=payload.price_adjustment or 0
        )
        self.db.add(variant)
        await self.db.commit()
        await self.db.refresh(variant)

        return ProductVariantResponse.model_validate(variant)

    async def update_variant(self, seller_id: int, product_id: int, variant_id: int, payload: ProductVariantUpdate):
        await self._ensure_product_ownership(seller_id, product_id)
        variant = await self._ensure_variant_ownership(product_id, variant_id)

        if payload.variant_name:
            name = payload.variant_name.strip()
            # Check trùng tên
            stmt = select(ProductVariant).where(
                ProductVariant.product_id == product_id,
                func.lower(ProductVariant.variant_name) == name.lower(),
                ProductVariant.variant_id != variant_id
            )
            if (await self.db.execute(stmt)).scalar_one_or_none():
                raise HTTPException(status.HTTP_409_CONFLICT, detail="Variant name exists")

            variant.variant_name = name

        if payload.price_adjustment is not None:
            variant.price_adjustment = payload.price_adjustment

        try:
            await self.db.commit()
            await self.db.refresh(variant)
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Integrity error")

        return ProductVariantResponse.model_validate(variant)

    async def delete_variant(self, seller_id: int, product_id: int, variant_id: int):
        await self._ensure_product_ownership(seller_id, product_id)
        variant = await self._ensure_variant_ownership(product_id, variant_id)

        if await self._has_orders(variant_id, 'variant'):
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Variant used in orders")

        # Xóa các size con của variant này trước
        del_size_stmt = delete(ProductSize).where(ProductSize.variant_id == variant_id)
        await self.db.execute(del_size_stmt)

        await self.db.delete(variant)
        await self.db.commit()

        return {"deleted": True, "variant_id": variant_id}

    async def create_size(self, seller_id: int, product_id: int, variant_id: int, payload: ProductSizeCreate):
        await self._ensure_product_ownership(seller_id, product_id)
        await self._ensure_variant_ownership(product_id, variant_id)
        name = (payload.size_name or "").strip()
        if not name:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Size name required")

        # Check trùng size
        stmt = select(ProductSize).where(
            ProductSize.variant_id == variant_id,
            func.lower(ProductSize.size_name) == name.lower()
        )
        if (await self.db.execute(stmt)).scalar_one_or_none():
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Size exists")

        avail = payload.available_units or 0
        in_stock = payload.in_stock if payload.in_stock is not None else (avail > 0)
        size = ProductSize(
            variant_id=variant_id,
            size_name=name,
            available_units=avail,
            in_stock=in_stock
        )

        self.db.add(size)
        await self.db.commit()
        await self.db.refresh(size)

        return ProductSizeResponse.model_validate(size)

    async def update_size(self, seller_id: int, product_id: int, variant_id: int, size_id: int,
                          payload: ProductSizeUpdate):
        await self._ensure_product_ownership(seller_id, product_id)
        await self._ensure_variant_ownership(product_id, variant_id)
        size = await self._ensure_size_ownership(variant_id, size_id)

        if payload.size_name:
            name = payload.size_name.strip()
            stmt = select(ProductSize).where(
                ProductSize.variant_id == variant_id,
                func.lower(ProductSize.size_name) == name.lower(),
                ProductSize.size_id != size_id
            )
            if (await self.db.execute(stmt)).scalar_one_or_none():
                raise HTTPException(status.HTTP_409_CONFLICT, detail="Size exists")
            size.size_name = name

        if payload.available_units is not None:
            size.available_units = payload.available_units
            if size.available_units == 0: size.in_stock = False

        if payload.in_stock is not None:
            size.in_stock = payload.in_stock
            if not size.in_stock: size.available_units = 0

        await self.db.commit()
        await self.db.refresh(size)

        return ProductSizeResponse.model_validate(size)

    async def delete_size(self, seller_id: int, product_id: int, variant_id: int, size_id: int):
        await self._ensure_product_ownership(seller_id, product_id)
        await self._ensure_variant_ownership(product_id, variant_id)
        size = await self._ensure_size_ownership(variant_id, size_id)

        if await self._has_orders(size_id, 'size'):
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Size used in orders")

        await self.db.delete(size)
        await self.db.commit()

        return {"deleted": True}

    async def get_variant_sizes(self, seller_id: int, product_id: int, variant_id: int):
        await self._ensure_product_ownership(seller_id, product_id)
        await self._ensure_variant_ownership(product_id, variant_id)

        stmt = select(ProductSize).where(ProductSize.variant_id == variant_id)
        result = await self.db.execute(stmt)
        sizes = result.scalars().all()

        return [ProductSizeResponse.model_validate(s) for s in sizes]

    async def upload_images(self, seller_id: int, product_id: int, files: List[UploadFile],
                            primary_index: Optional[int] = None):
        await self._ensure_product_ownership(seller_id, product_id)

        # Upload S3
        results = await storage.upload_many('products', files, max_size_mb=5)

        # Nếu set primary, reset các ảnh cũ về False
        if primary_index is not None and 0 <= primary_index < len(results):
            update_stmt = (
                update(ProductImage)
                .where(ProductImage.product_id == product_id)
                .values(is_primary=False)
            )
            await self.db.execute(update_stmt)

        responses = []
        for idx, res in enumerate(results):
            is_pri = (primary_index is not None and idx == primary_index)
            img = ProductImage(product_id=product_id, image_url=res["object_key"], is_primary=is_pri)
            self.db.add(img)
            # flush async
            await self.db.flush()

            responses.append(ProductImageResponse(
                product_image_id=img.product_image_id, product_id=img.product_id,
                image_url=img.image_url, public_image_url=public_url(img.image_url), is_primary=is_pri
            ))

        await self.db.commit()
        return responses

    async def set_primary_image(self, seller_id: int, product_id: int, image_id: int):
        await self._ensure_product_ownership(seller_id, product_id)

        # Tìm ảnh
        stmt = select(ProductImage).where(
            ProductImage.product_image_id == image_id,
            ProductImage.product_id == product_id
        )
        result = await self.db.execute(stmt)
        img = result.scalar_one_or_none()

        if not img:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Image not found")

        # Set tất cả về False
        update_stmt = (
            update(ProductImage)
            .where(ProductImage.product_id == product_id)
            .values(is_primary=False)
        )
        await self.db.execute(update_stmt)

        # Set ảnh này True
        img.is_primary = True
        await self.db.commit()
        await self.db.refresh(img)

        return ProductImageResponse(
            product_image_id=img.product_image_id, product_id=img.product_id,
            image_url=img.image_url, public_image_url=public_url(img.image_url), is_primary=True
        )

    async def delete_image(self, seller_id: int, product_id: int, image_id: int):
        await self._ensure_product_ownership(seller_id, product_id)

        stmt = select(ProductImage).where(
            ProductImage.product_image_id == image_id,
            ProductImage.product_id == product_id
        )
        result = await self.db.execute(stmt)
        img = result.scalar_one_or_none()

        if not img:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Image not found")

        was_primary = img.is_primary
        try:
            # S3 Delete (Sync hoặc Async tùy thư viện, ở đây giả sử sync cho an toàn nếu lib cũ)
            storage.delete_file(img.image_url)
        except:
            pass

        await self.db.delete(img)
        await self.db.commit()

        # Nếu xóa ảnh chính -> Set ảnh tiếp theo làm chính
        if was_primary:
            stmt_next = select(ProductImage).where(ProductImage.product_id == product_id).order_by(
                ProductImage.product_image_id.asc()
            ).limit(1)
            res_next = await self.db.execute(stmt_next)
            next_img = res_next.scalar_one_or_none()

            if next_img:
                next_img.is_primary = True
                await self.db.commit()

        return {"deleted": True, "id": image_id}


def get_seller_product_service(db: AsyncSession = Depends(get_db)):
    return SellerProductService(db)