from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from ...schemas.common import Page
from ...config.db import get_db
from ...services.buyer.buyer_product_service import BuyerProductService, RatingFilter, get_procdut_service, ProductSort
from ...schemas.product import ProductImageResponse, ProductList, ProductResponseBuyer, ProductResponse
router = APIRouter(prefix="/buyer/products", tags=["buyer_products"])


@router.get("/products", response_model=Page)
async def get_products(
    q: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    rating_filter: Optional[RatingFilter] = None,
    sort: Optional[ProductSort] = Query(
        ProductSort.newest,
        description="Cách sắp xếp sản phẩm"
    ),
    limit: int = 12,
    offset: int = 0,
    service: BuyerProductService = Depends(get_procdut_service),
):
    """
    Lấy danh sách sản phẩm cho người mua.

    - Tìm kiếm theo tên (q)
    - Lọc theo khoảng giá (min_price, max_price)
    - Lọc theo mức đánh giá
    - Hỗ trợ phân trang
    """
    return await service.get_buyer_products(
        q=q,
        min_price=min_price,
        max_price=max_price,
        rating_filter=rating_filter,
        limit=limit,
        offset=offset,
    )

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

# =================== TOP SẢN PHẨM MỚI NHẤT =======================
@router.get("/latest_products", response_model=Page)
async def get_latest_products(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: BuyerProductService = Depends(get_procdut_service)
):
    """
    Lấy danh sách sản phẩm mới nhất.

    - Sắp xếp theo thời gian tạo sản phẩm (mới nhất trước)
    - Hỗ trợ phân trang
    """

    return await service.get_latest_products(limit=limit, offset=offset)

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

