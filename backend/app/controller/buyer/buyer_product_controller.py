from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session, Query as SAQuery
from ...config.db import get_db
from ...services.buyer import buyer_product_service
from ...models.catalog import Product
from ...services.buyer.buyer_product_service import RatingFilter, paginate_simple
from pydantic import BaseModel
from decimal import Decimal

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
