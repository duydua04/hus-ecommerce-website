from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from ...schemas.common import Page
from ...config.db import get_db
from ...services.buyer.buyer_product_service import BuyerProductService, RatingFilter, get_procdut_service

router = APIRouter(prefix="/buyer/products", tags=["buyer_products"])


@router.get("")
async def get_buyer_products(
    keyword: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    rating: Optional[RatingFilter] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Lấy danh sách sản phẩm cho người mua.

    - Tìm kiếm theo tên sản phẩm
    - Lọc theo khoảng giá
    - Lọc theo mức đánh giá
    - Hỗ trợ phân trang
    """
    service = BuyerProductService(db)

    stmt = service.base_query()

    if keyword:
        stmt = await service.filter_by_keyword(stmt, keyword)

    stmt = service.filter_by_price(stmt, min_price, max_price)
    stmt = service.filter_by_rating_option(stmt, rating)

    products = await service.paginate_simple(stmt, page, page_size)

    return {
        "page": page,
        "page_size": page_size,
        "items": products,
    }

# =================== LẤY DANH MỤC SẢN PHẨM =======================
@router.get("/categories", response_model=Page)
async def get_categories(
    q: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: BuyerProductService = Depends(get_procdut_service)
):
    """
    Lấy danh sách danh mục cho người mua.

    - Tìm kiếm theo tên danh mục
    - Hỗ trợ tìm kiếm theo từ khóa (q)
    - Hỗ trợ phân trang
    """
    return await service.list_categories(q=q,limit=limit, offset=offset)

# =================== LẤY SẢN PHẨM THEO DANH MỤC =======================
@router.get("/categories/{category_id}")
async def get_products_by_category(
    category_id: int,
    q: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: BuyerProductService = Depends(get_procdut_service)
):
    """
    Lấy thông tin chi tiết của một danh mục sản phẩm.

    - Trả về thông tin danh mục
    - Trả 404 nếu không tồn tại
    """

    return await service.get_products_by_category(category_id, q=q,limit=limit, offset=offset)


# =================== CHI TIẾT SẢN PHẨM =======================
@router.get("/{product_id}")
async def get_buyer_product_detail(
    product_id: int,
    service: BuyerProductService = Depends(get_procdut_service),
):
    """
    Lấy thông tin chi tiết của một sản phẩm.

    - Bao gồm hình ảnh, biến thể và size
    - Chỉ trả về sản phẩm đang bán
    - Trả 404 nếu không tồn tại
    """

    return await service.get_buyer_product_detail(product_id)

