from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, Query as SAQuery
from ...config.db import get_db
from ...services.buyer import buyer_product_service
from ...models.catalog import Product, ProductImage, ProductSize, ProductVariant
from ...services.buyer.buyer_product_service import RatingFilter, paginate_simple
from pydantic import BaseModel
from decimal import Decimal
from sqlalchemy.orm import selectinload

class ProductSummary(BaseModel):
    name: str
    rating: float
    base_price: Decimal
    sold_quantity: int

    class Config:
        orm_mode = True   # để có thể đọc từ SQLAlchemy model

router = APIRouter(
    prefix="/buyer/products",
    tags=["products"]
)

# Lấy danh sách sản phẩm có filter
@router.get("", response_model=List[ProductSummary])
def get_filtered_product(
    keyword: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1),  # số trang hiện tại, default page 1
    rating_filter: Optional[RatingFilter] = Query(
        None,
        description="Chọn mức đánh giá: 5⭐  ≥4⭐  ≥3⭐  ≥2⭐  ≥1⭐"
    ),

    db: Session = Depends(get_db) 
):
    query: SAQuery = db.query(Product) # Tạo một Query object bắt đầu từ model Product.

    # gọi từng hàm filter đã viết
    query = query.filter(Product.is_active == "True")
    query = buyer_product_service.filter_by_keyword(query, keyword)
    query = buyer_product_service.filter_by_price(query, min_price, max_price)
    query = buyer_product_service.filter_by_rating_option(query, rating_filter)

    products = paginate_simple(query, page, page_size=12) # trả về danh sách tất cả theo trang
    return products

# Đưa ra thông tin chi tiết sản phẩm
@router.get("/{product_id}", response_model=Dict[str, Any])
def get_product_detail(product_id: int, db: Session = Depends(get_db)):
    product = (
    db.query(Product)
    .filter(Product.product_id == product_id, Product.is_active == True)
    .options(
         # tải sẵn ảnh, variants, sizes
        selectinload(Product.images),
        selectinload(Product.variants).selectinload(ProductVariant.sizes)  
    )
    .first()
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Sắp xếp images: primary đứng đầu
    images = sorted(product.images, key=lambda x: not x.is_primary)
    image_urls = [img.image_url for img in images]

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
        "images": image_urls,
        "variants": variants
    }
