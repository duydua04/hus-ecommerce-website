from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, desc, select, func, asc
from sqlalchemy.orm import selectinload
from typing import Optional
from enum import Enum
from collections import defaultdict
from ...schemas.common import Page, PageMeta
from ...models import Product, ProductSize, ProductImage, ProductVariant, Category
from ...schemas.product import ProductImageResponse, ProductList, ProductResponseBuyer, ProductResponse, ProductVariantLiteResponse, ProductVariantWithSizesResponse
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
        return ( select(Product) .where(Product.is_active.is_(True)) .order_by(Product.created_at.desc()) )
    def filter_by_price(
            self,
            stmt,
            min_price: Optional[float] = None,
            max_price: Optional[float] = None,
        ):
            if min_price is not None:
                stmt = stmt.where(Product.base_price >= min_price)

            if max_price is not None:
                stmt = stmt.where(Product.base_price <= max_price)

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
        sort: Optional[ProductSort],
    ):
        if sort is None:
            # Mặc định: mới nhất
            return stmt.order_by(Product.created_at.desc())

        if sort == ProductSort.newest:
            return stmt.order_by(Product.created_at.desc())

        if sort == ProductSort.price_asc:
            return stmt.order_by(Product.base_price.asc())

        if sort == ProductSort.price_desc:
            return stmt.order_by(Product.base_price.desc())

        if sort == ProductSort.best_seller:
            return stmt.order_by(Product.sold_quantity.desc())

        return stmt
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
        
        #  base query
        stmt = self.base_query()

        # filter theo keyword (nếu có)
        if q and q.strip():
            stmt = stmt.where(Product.name.ilike(f"%{q.strip()}%"))

        # filter theo giá
        stmt = self.filter_by_price(stmt, min_price, max_price)

        # filter theo rating
        stmt = self.filter_by_rating_option(stmt, rating_filter)

        # áp dụng sort
        stmt = self.apply_sort(stmt, sort)
        # total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # phân trang
        result = await self.db.execute(
            stmt.limit(limit).offset(offset)
        )
        products = result.scalars().all()
        product_ids = [p.product_id for p in products]
        primary_map = {}

        if product_ids:
            img_stmt = select(ProductImage.product_id, ProductImage.image_url).where(
                ProductImage.product_id.in_(product_ids),
                ProductImage.is_primary.is_(True)
            )
            img_res = await self.db.execute(img_stmt)
            primary_map = {pid: url for pid, url in img_res.all()}
        # map response
        data = []
        for p in products:
            base = ProductResponse.model_validate(p)
            data.append(ProductList(
                **base.model_dump(),
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
    
    # =================== LẤY SẢN PHẨM CỦA DANH MỤC =======================
    async def get_products_by_category(
        self,
        category_id: int,
        q: Optional[str],
        limit: int = 10,
        offset: int = 0, 
    ):
        stmt = select(Product) .where(Product.is_active.is_(True)).where(Product.category_id == category_id) .order_by(Product.created_at.desc())

        if q and q.strip():
            stmt = stmt.where(
                Product.name.ilike(f"%{q.strip()}%")
            )

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


    # =================== TOP SẢN PHẨM MỚI NHẤT =======================
    async def get_latest_products(self, limit: int = 10, offset: int = 0):
        stmt = self.base_query()

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Product.created_at.desc()).limit(limit).offset(offset)
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
     # =================== LẤY CHI TIẾT SẢN PHẨM =======================   
    async def get_buyer_product_detail(self, product_id: int):
        stmt = (
            select(Product)
            .where(
                Product.product_id == product_id,
                Product.is_active.is_(True),
            )
            .options(
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(
                    ProductVariant.sizes
                ),
            )
        )

        result = await self.db.execute(stmt)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=404, detail="Product not found"
            )

        # === ẢNH ===
        images_stmt = (
            select(ProductImage)
            .where(ProductImage.product_id == product_id)
            .order_by(
                ProductImage.is_primary.desc(),
                ProductImage.product_image_id.asc(),
            )
        )
        images_result = await self.db.execute(images_stmt)
        images = images_result.scalars().all()

        image_responses = [
            ProductImageResponse(
                product_image_id=img.product_image_id,
                product_id=img.product_id,
                image_url=img.image_url,
                public_image_url=public_url(img.image_url),
                is_primary=img.is_primary,
            )
            for img in images
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

        return {
            "product_id": product.product_id,
            "name": product.name,
            "base_price": float(product.base_price),
            "discount_percent": float(product.discount_percent),
            "price_after_discount": float(
                product.base_price
                - product.base_price * product.discount_percent / 100
            ),
            "rating": float(product.rating),
            "review_count": product.review_count,
            "sold_quantity": product.sold_quantity,
            "description": product.description,
            "weight": float(product.weight)
            if product.weight
            else None,
            "images": image_responses,
            "variants": variants,
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
    
def get_procdut_service(db: AsyncSession = Depends(get_db)):
    return BuyerProductService(db)