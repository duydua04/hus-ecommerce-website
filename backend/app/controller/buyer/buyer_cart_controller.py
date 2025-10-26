from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, Query as SAQuery
from ...config.db import get_db
from ...services.buyer import buyer_cart_service
from ...models.catalog import Product, ProductImage, ProductSize, ProductVariant
from ...services.buyer.buyer_product_service import RatingFilter, paginate_simple, get_buyer_product_detail
from pydantic import BaseModel
from decimal import Decimal
from sqlalchemy.orm import selectinload
from datetime import datetime

router = APIRouter(
    prefix="/buyer/cart",
    tags=["cart"]
)

# === LẤY RA THÔNG TIN ĐỂ NGƯỜI DÙNG CHỌN PHÂN LOẠI TRƯỚC KHI THÊM VÀO GIỎ HÀNG ===
@router.get("/{product_id}/options")
def get_product_options(product_id: int, db: Session = Depends(get_db)):
    return buyer_cart_service.get_product_options(product_id, db)


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
        cart = buyer_cart_service.add_to_cart(
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
    return buyer_cart_service.get_buyer_cart(buyer_id, db)


# ===== XÓA SẢN PHẨM KHỎI GIỎ HÀNG ======
@router.delete('/buyer/{buyer_id}/product/{product_id}')
def delete_product(product_id : int, buyer_id: int, db: Session = Depends(get_db)):
    return buyer_cart_service.buyer_delete_product(buyer_id, product_id, db)