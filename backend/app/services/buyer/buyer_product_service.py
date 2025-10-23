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


class RatingFilter(str, Enum):
    five = "5"         
    four_plus = "4plus"  
    three_plus = "3plus" 
    two_plus = "2plus"
    one_plus ="1plus"

# === LỌC SẢN PHẨM THEO TÊN ====
def filter_by_keyword(query: Query, keyword: str):
    # Trường hợp không nhập keyword
    if not keyword or keyword.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng nhập tên sản phẩm để tìm kiếm"
        )

    # Thêm điều kiện lọc theo keyword
    query = query.filter(Product.name.ilike(f"%{keyword}%"))

    # Kiểm tra xem có sản phẩm nào không
    if query.count() == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm nào với từ khóa '{keyword}'"
        )

    return query

# Lọc sản phẩm theo khoảng giá
def filter_by_price(query: Query, min_price: float = None, max_price: float = None):
    if min_price is not None and max_price is not None:
        return query.filter(and_(Product.base_price >= min_price, Product.base_price <= max_price))
    elif min_price is not None:
        return query.filter(Product.base_price >= min_price)
    elif max_price is not None:
        return query.filter(Product.base_price <= max_price)
    return query

# Lọc sản phẩm theo mức độ đánh giá
def filter_by_rating_option(query: Query, rating_filter: Optional[RatingFilter]):
    if rating_filter is None:
        # Không truyền filter => giữ nguyên query
        return query
    if rating_filter == RatingFilter.one_plus:
        return query.filter(Product.rating >= 1)
    elif rating_filter == RatingFilter.two_plus:
        query = query.filter(Product.rating >= 2)
    elif rating_filter == RatingFilter.three_plus:
        query = query.filter(Product.rating >= 3)
    elif rating_filter == RatingFilter.four_plus:
        query = query.filter(Product.rating >= 4)
    else:
        query = query.filter(Product.rating == 5) 
    return query

# ==== PHÂN TRANG ====
def paginate_simple(query, page: int = 1, page_size: int = 12):
    offset = (page - 1) * page_size # offset là tính số sản phẩm đã được phân trang trước đó để bỏ qua khi ở trang mới
    return query.offset(offset).limit(page_size).all() # phương thức offset là bỏ qua sản phẩm ban đầu

# === ĐƯA RA THÔNG TIN CHI TIẾT SẢN PHẨM ===
def get_buyer_product_detail(product_id: int, db: Session ):
    product = (
    db.query(Product)
    .filter(Product.product_id == product_id, Product.is_active == True)
    # .options(
    #      # tải sẵn ảnh, variants, sizes
    #     selectinload(Product.images),
    #     selectinload(Product.variants).selectinload(ProductVariant.sizes)  
    # )
    .first()
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Sắp xếp images: primary đứng đầu
    # Lay hinh anh san pham
    images = db.query(ProductImage).filter(
        ProductImage.product_id == product_id
    ).order_by(
        ProductImage.is_primary.desc(),
        ProductImage.product_image_id.asc()
    ).all()

    image_responses = [
        ProductImageResponse(
            product_image_id=img.product_image_id,
            product_id=img.product_id,
            image_url=img.image_url,
            public_image_url=public_url(img.image_url),
            is_primary=img.is_primary
        )
        for img in images
    ]

    # Phân loại + size
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
                    "in_stock": s.in_stock
                }
                for s in v.sizes
            ]
        }
        for v in product.variants
    ]

    return {
        "product_id": product.product_id,
        "name": product.name,
        "base_price": float(product.base_price),
        "discount_percent": float(product.discount_percent),
        "price_after_discount": float(product.base_price - product.base_price * product.discount_percent / 100),
        "rating": float(product.rating),
        "review_count": product.review_count,
        "sold_quantity": product.sold_quantity,
        "description": product.description,
        "weight": float(product.weight) if product.weight else None,
        "images": image_responses ,
        "variants": variants
    }



