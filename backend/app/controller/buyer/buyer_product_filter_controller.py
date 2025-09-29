from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session, Query as SAQuery
from ...config.db import get_db
from ...services.buyer import product_filter
from ...models.catalog import Product
from ...services.buyer.product_filter import RatingFilter
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
    rating_filter: Optional[RatingFilter] = Query(
        None,
        description="Chọn mức đánh giá: 5⭐  ≥4⭐  ≥3⭐  ≥2⭐  ≥1⭐"
    ),

    db: Session = Depends(get_db) 
):
    query: SAQuery = db.query(Product) # Tạo một Query object bắt đầu từ model Product.

    # gọi từng hàm filter đã viết
    query = product_filter.filter_by_keyword(query, keyword)
    query = product_filter.filter_by_price(query, min_price, max_price)
    query = product_filter.filter_by_rating_option(query, rating_filter)

    products = query.all() # trả về danh sách tất cả bản ghi phù hợp.
    return products