from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload, Query
from ...schemas.product import ProductResponse
from ...models import Product, ProductSize, ProductImage, ProductVariant
from sqlalchemy import and_
from typing import Optional
from enum import Enum
from ...models.cart import ShoppingCart, ShoppingCartItem
from datetime import datetime



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


# === THÊM SẢN PHẨM VÀO GIỎ HÀNG ====
def add_to_cart(session: Session, buyer_id: int, product_id: int, variant_id=None, size_id=None, quantity=1):
    """ 
    Thêm sản phẩm vào giỏ hàng. 
    Nếu giỏ hàng hoặc item chưa có thì tạo mới. 
    Nếu item đã tồn tại thì tăng số lượng. 
    """

    cart = session.query(ShoppingCart).filter_by(buyer_id=buyer_id).first()
    if not cart:
        cart = ShoppingCart(buyer_id=buyer_id)
        session.add(cart)
        session.flush()  # shopping_cart_id đã có

    # Kiểm tra variant/size và tồn kho
    size = None
    if size_id:
        size = session.query(ProductSize).filter_by(size_id=size_id).first()
        if not size:
            raise Exception("Size không tồn tại")
        if not size.in_stock or size.available_units < quantity:
            raise Exception("Số lượng vượt quá tồn kho")

    if variant_id:
        variant = session.query(ProductVariant).filter_by(variant_id=variant_id).first()
        if not variant:
            raise Exception("Variant không tồn tại")

    # Kiểm tra item trong giỏ
    existing_item = (
        session.query(ShoppingCartItem)
        .filter_by(
            shopping_cart_id=cart.shopping_cart_id,
            product_id=product_id,
            variant_id=variant_id,
            size_id=size_id,
        )
        .first()
    )

    if existing_item:
        new_qty = existing_item.quantity + quantity
        if size and new_qty > size.available_units:
            raise Exception("Không đủ hàng trong kho")
        existing_item.quantity = new_qty
    else:
        new_item = ShoppingCartItem(
            shopping_cart_id=cart.shopping_cart_id,
            product_id=product_id,
            variant_id=variant_id,
            size_id=size_id,
            quantity=quantity,
        )
        session.add(new_item)

    cart.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(cart)
    return cart



