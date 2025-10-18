from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, Query as SAQuery
from ...config.db import get_db
from ...services.buyer import buyer_product_service
from ...models.catalog import Product, ProductImage, ProductSize, ProductVariant
from ...services.buyer.buyer_product_service import RatingFilter, paginate_simple, get_buyer_product_detail
from pydantic import BaseModel
from decimal import Decimal
from sqlalchemy.orm import selectinload
from datetime import datetime


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

#  === LẤY DANH SÁCH SẢN PHẨM CÓ FILTER ===
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



# === ĐƯA RA THÔNG TIN CHI TIẾT SẢN PHẨM ===
@router.get("/{product_id}", response_model=Dict[str, Any])
def get_buyer_product_detail(product_id: int, db: Session = Depends(get_db)):
  
    return buyer_product_service.get_buyer_product_detail(product_id, db)


# === LẤY RA THÔNG TIN ĐỂ NGƯỜI DÙNG CHỌN PHÂN LOẠI TRƯỚC KHI THÊM VÀO GIỎ HÀNG ===
@router.get("/{product_id}/options")
def get_product_options(product_id: int, db: Session = Depends(get_db)):
    return buyer_product_service.get_product_options(product_id, db)


# === THÊM SẢN PHẨM VÀO GIỎ HÀNG ====
# Request schema
class AddToCartRequest(BaseModel):
    buyer_id: int
    product_id: int
    variant_id: Optional[int] = None
    size_id: Optional[int] = None
    quantity: int = 1

@router.post("/addToCart")
def add_to_cart(payload: AddToCartRequest, db: Session = Depends(get_db)):
    try:
        cart = buyer_product_service.add_to_cart(
            db=db,
            buyer_id=payload.buyer_id,
            product_id=payload.product_id,
            variant_id=payload.variant_id,
            size_id=payload.size_id,
            quantity=payload.quantity,
        )
        return {
            "message": f"✅ Thêm {payload.quantity} sản phẩm vào giỏ hàng thành công",
            "cart_id": cart.shopping_cart_id,
            "total_items": len(cart.items),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# === HIỂN THỊ GIỎ HÀNG CỦA NGƯỜI DÙNG ===
@router.get('/showCart/{buyer_id}')
def get_buyer_cart(buyer_id : int, db: Session = Depends(get_db)):
    return buyer_product_service.get_buyer_cart(buyer_id, db)