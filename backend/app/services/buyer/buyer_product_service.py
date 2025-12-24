from ast import stmt
from unittest import result
from fastapi import HTTPException, status, Depends
from decimal import Decimal


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, desc, select, func, asc, cast, Numeric
from sqlalchemy.orm import selectinload
from typing import Optional
from enum import Enum

from ...schemas.common import Page, PageMeta
from ...models import Product, ProductSize, ProductImage, ProductVariant, Category, Seller
from ...schemas.product import ProductImageResponse, ProductList, ProductResponseBuyer, ProductResponse, ProductVariantLiteResponse, ProductVariantWithSizesResponse, ProductResponseBuyer, ShopInfoResponse
from ...config.s3 import public_url
from ...config.db import get_db

class RatingFilter(str, Enum):
    five = "5"
    four_plus = "4plus"
    three_plus = "3plus"
    two_plus = "2plus"
    one_plus = "1plus"

class ProductSort(str, Enum):
    newest = "newest"
    price_asc = "price_asc"
    price_desc = "price_desc"
    best_seller = "best_seller"

class BuyerProductService:
    def __init__(self, db: AsyncSession):
        self.db = db
    def base_query(self): 
        return (
        select(
            Product.product_id.label("product_id"),
            func.min(
                Product.base_price + func.coalesce(ProductVariant.price_adjustment, 0)
            ).label("min_base_price"),
            func.max(
                Product.base_price + func.coalesce(ProductVariant.price_adjustment, 0)
            ).label("max_base_price"),
            (
                func.min(
                    Product.base_price + func.coalesce(ProductVariant.price_adjustment, 0)
                ) * (100 - Product.discount_percent) / 100
            ).label("sale_price"),
        )
        .join(ProductVariant, ProductVariant.product_id == Product.product_id)
        .group_by(Product.product_id)
        .subquery()
    )
    
    def filter_by_price(self, stmt, price_subq, min_price=None, max_price=None):
        if min_price is not None:
            stmt = stmt.where(price_subq.c.sale_price >= cast(min_price, Numeric(12, 2)))

        if max_price is not None:
            stmt = stmt.where(price_subq.c.sale_price <= cast(max_price, Numeric(12, 2)))

        return stmt
    def filter_by_rating_option(
        self,
        stmt,
        rating_filter: Optional[RatingFilter],
    ):
        if rating_filter is None:
            return stmt

        rating_map = {
            RatingFilter.one_plus: 1,
            RatingFilter.two_plus: 2,
            RatingFilter.three_plus: 3,
            RatingFilter.four_plus: 4,
            RatingFilter.five: 5,
        }

        if rating_filter == RatingFilter.five:
            return stmt.where(Product.rating == 5)

        return stmt.where(Product.rating >= rating_map[rating_filter])
    def apply_sort(
        self,
        stmt,
        price_subq,
        sort: Optional[ProductSort],
    ):
        # mặc định: newest
        if not sort or sort == ProductSort.newest:
            return stmt.order_by(Product.created_at.desc())

        if sort == ProductSort.price_asc:
            return stmt.order_by(price_subq.c.sale_price.asc())

        if sort == ProductSort.price_desc:
            return stmt.order_by(price_subq.c.sale_price.desc())

        if sort == ProductSort.best_seller:
            return stmt.order_by(Product.sold_quantity.desc())

        # fallback an toàn
        return stmt.order_by(Product.created_at.desc())
    # =================== LẤY DANH SÁCH SẢN PHẨM CÓ CHỌN LỌC =======================
    async def get_buyer_products_filter(
        self,
        q: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        rating_filter: Optional[RatingFilter] = None,
        sort: Optional[ProductSort] = None,
        limit: int = 12,
        offset: int = 0,
    ):
        price_subq = self.base_query()
        stmt = (
            select(
                Product,
                price_subq.c.min_base_price,
                price_subq.c.max_base_price,
                price_subq.c.sale_price,
            )
            .join(price_subq, price_subq.c.product_id == Product.product_id)
            .where(Product.is_active.is_(True))
        )

        # filter theo keyword (nếu có)
        if q and q.strip():
            stmt = stmt.where(Product.name.ilike(f"%{q.strip()}%"))

        # filter theo giá
        stmt = self.filter_by_price(stmt, price_subq, min_price, max_price)
        # filter theo rating
        stmt = self.filter_by_rating_option(stmt, rating_filter)

        # áp dụng sort
        stmt = self.apply_sort(stmt, price_subq, sort)
        # total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # phân trang
        result = await self.db.execute(
            stmt.limit(limit).offset(offset)
        )
        rows = result.all()  # (Product, min_base_price, max_base_price)

        product_ids = [product.product_id for product, _, _, _ in rows]
        primary_map = {}

        if product_ids:
            img_stmt = select(
                ProductImage.product_id,
                ProductImage.image_url
            ).where(
                ProductImage.product_id.in_(product_ids),
                ProductImage.is_primary.is_(True)
            )
            img_res = await self.db.execute(img_stmt)
            primary_map = {pid: url for pid, url in img_res.all()}

        data = []
        for product, min_base_price, max_base_price, sale_price in rows:

            base = ProductResponseBuyer(
                product_id=product.product_id,
                created_at=product.created_at,
                name=product.name,
                seller_id=product.seller_id,
                discount_percent=product.discount_percent,
                sale_price=sale_price,
                rating=product.rating,
                review_count=product.review_count,
                sold_quantity=product.sold_quantity,
                category_id=product.category_id,
                description=product.description,
                is_active=product.is_active
            )

            item = {
                **base.model_dump(),
                "public_primary_image_url": public_url(
                    primary_map.get(product.product_id)
                ),
                "min_price": float(min_base_price),
                "max_price": float(max_base_price),
            }

            data.append(item)

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )
    # =================== LẤY SẢN PHẨM CỦA DANH MỤC =======================
    async def get_products_by_category(
        self,
        category_id: int,
        q: Optional[str],
        limit: int = 10,
        offset: int = 0, 
    ):
        price_subq = self.base_query()
        stmt = (
            select(
                Product,
                price_subq.c.min_base_price,
                price_subq.c.max_base_price,
                price_subq.c.sale_price,
            )
            .join(price_subq, price_subq.c.product_id == Product.product_id)
            .where(Product.is_active.is_(True))
            .where(Product.category_id == category_id)
        )

        # filter theo keyword (nếu có)
        if q and q.strip():
            stmt = stmt.where(Product.name.ilike(f"%{q.strip()}%"))

        # total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # phân trang
        result = await self.db.execute(
            stmt.limit(limit).offset(offset)
        )
        rows = result.all()  # (Product, min_base_price, max_base_price)

        product_ids = [product.product_id for product, _, _, _ in rows]
        primary_map = {}

        if product_ids:
            img_stmt = select(
                ProductImage.product_id,
                ProductImage.image_url
            ).where(
                ProductImage.product_id.in_(product_ids),
                ProductImage.is_primary.is_(True)
            )
            img_res = await self.db.execute(img_stmt)
            primary_map = {pid: url for pid, url in img_res.all()}

        data = []
        for product, min_base_price, max_base_price, sale_price in rows:

            base = ProductResponseBuyer(
                product_id=product.product_id,
                created_at=product.created_at,
                name=product.name,
                seller_id=product.seller_id,
                discount_percent=product.discount_percent,
                sale_price=sale_price,
                rating=product.rating,
                review_count=product.review_count,
                sold_quantity=product.sold_quantity,
                category_id=product.category_id,
                description=product.description,
                is_active=product.is_active
            )

            item = {
                **base.model_dump(),
                "public_primary_image_url": public_url(
                    primary_map.get(product.product_id)
                ),
                "min_price": float(min_base_price),
                "max_price": float(max_base_price),
            }

            data.append(item)

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )
    # =================== LẤY CHI TIẾT SẢN PHẨM =======================
    async def get_buyer_product_detail(self, product_id: int):
        price_subq = self.base_query()
        stmt = (
            select(
                Product,
                price_subq.c.min_base_price,
                price_subq.c.max_base_price,
            )
            .join(price_subq, price_subq.c.product_id == Product.product_id)
            .options(
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.sizes),
            )
            .where(
                Product.product_id == product_id,
                Product.is_active.is_(True),
            )
        )

        result = await self.db.execute(stmt)
        row = result.one_or_none()

        if not row:
            raise HTTPException(status_code=404, detail="Product not found")

        product, min_base_price, max_base_price = row

        # === ẢNH ===
        image_responses = [
            ProductImageResponse(
                product_image_id=img.product_image_id,
                product_id=img.product_id,
                image_url=img.image_url,
                public_image_url=public_url(img.image_url),
                is_primary=img.is_primary,
            )
            for img in sorted(
                product.images,
                key=lambda x: (-x.is_primary, x.product_image_id),
            )
        ]

        # === VARIANT + SIZE ===
        variants = [
            {
                "variant_id": v.variant_id,
                "variant_name": v.variant_name,
                "price_adjustment": float(v.price_adjustment),
                "sizes": [
                    {
                        "size_id": s.size_id,
                        "size_name": s.size_name,
                        "available_units": s.available_units,
                        "in_stock": s.in_stock,
                    }
                    for s in v.sizes
                ],
            }
            for v in product.variants
        ]

        # === Tính sale_price min + max ===
        if product.variants:
            prices = [product.base_price + v.price_adjustment for v in product.variants]
            sale_price_min = float(
                min_base_price * (100 - product.discount_percent) / 100
            )
            sale_price_max = float(
                max_base_price * (100 - product.discount_percent) / 100
            )

        return {
            "product_id": product.product_id,
            "name": product.name,
            "min_base_price": float(min_base_price),
            "max_base_price": float(max_base_price),
            "discount_percent": float(product.discount_percent),
            "sale_price_min": sale_price_min,
            "sale_price_max": sale_price_max,
            "rating": float(product.rating),
            "review_count": product.review_count,
            "sold_quantity": product.sold_quantity,
            "description": product.description,
            "weight": float(product.weight) if product.weight else None,
            "images": image_responses,
            "variants": variants,
        }
    # =================== LẤY GIÁ SẢN PHẨM THEO VARIANT VÀ SIZE =======================
    async def get_product_price(
        self,
        product_id: int,
        variant_id: int | None = None,
        size_id: int | None = None,
    ):
        stmt = select(Product).where(
            Product.product_id == product_id,
            Product.is_active.is_(True)
        )
        result = await self.db.execute(stmt)
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        price_adjustment = Decimal(0)
        variant = None

        if variant_id:
            variant_stmt = (
                select(ProductVariant)
                .options(selectinload(ProductVariant.sizes))
                .where(
                    ProductVariant.variant_id == variant_id,
                    ProductVariant.product_id == product_id
                )
            )
            variant_result = await self.db.execute(variant_stmt)
            variant = variant_result.scalar_one_or_none()
            if not variant:
                raise HTTPException(status_code=404, detail="Variant not found")

            price_adjustment = variant.price_adjustment

            if size_id:
                size = next((s for s in variant.sizes if s.size_id == size_id), None)
                if not size:
                    raise HTTPException(status_code=404, detail="Size not found")

        final_price = product.base_price + price_adjustment
        sale_price = final_price * (Decimal(100) - product.discount_percent) / Decimal(100)

        return {
            "product_id": product.product_id,
            "variant_id": variant_id,
            "size_id": size_id,
            "base_price": float(product.base_price),
            "price_adjustment": float(price_adjustment) if variant else None,
            "discount_percent": float(product.discount_percent),
            "sale_price": float(sale_price)
        }
    # =================== LẤY VARIANTS CỦA SẢN PHẨM =======================
    async def get_product_variants(self, product_id: int):
        stmt = (
            select(ProductVariant)
            .where(ProductVariant.product_id == product_id)
            .order_by(asc(ProductVariant.variant_id))
        )
        result = await self.db.execute(stmt)
        variants = result.scalars().all()

        return [
            ProductVariantLiteResponse.model_validate(v)
            for v in variants
        ]

    # =================== LẤY SIZE THEO VARIANTS CỦA SẢN PHẨM =======================
    async def get_variant_sizes(self, variant_id: int):
        stmt = (
            select(ProductVariant)
            .where(ProductVariant.variant_id == variant_id)
            .options(selectinload(ProductVariant.sizes))
        )

        result = await self.db.execute(stmt)
        variant = result.scalar_one_or_none()

        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")

        return ProductVariantWithSizesResponse.model_validate(variant)
    
    # =================== LẤY THÔNG TIN SHOP THEO SẢN PHẨM =======================
    async def get_shop_info_by_product(
        self,
        product_id: int,
    ):
        stmt = (
            select(
                Seller.seller_id,
                Seller.shop_name,
                Seller.avt_url,
                Seller.average_rating,
                Seller.rating_count,
            )
            .join(Product, Product.seller_id == Seller.seller_id)
            .where(Product.product_id == product_id)
        )

        result = await self.db.execute(stmt)
        row = result.one_or_none()

        if not row:
            raise HTTPException(status_code=404, detail="Shop not found")

        return ShopInfoResponse(
            seller_id=row.seller_id,
            shop_name=row.shop_name,
            avt_url=public_url(row.avt_url),
            average_rating=float(row.average_rating),
            rating_count=row.rating_count,
        )

def get_procduct_service(db: AsyncSession = Depends(get_db)):
    return BuyerProductService(db)