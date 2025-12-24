from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional


from ...schemas.common import Page
from ...config.db import get_db
from ...services.buyer.buyer_product_service import (
    BuyerProductService,
    RatingFilter,
    get_procduct_service,
    ProductSort,
)
from ...schemas.product import (
    ProductImageResponse,
    ProductVariantLiteResponse,
    ProductVariantWithSizesResponse,
    ProductPriceRequest,
    ProductPriceResponse,
    ShopInfoResponse,
)
router = APIRouter(prefix="/buyer/products", tags=["buyer_products"])

# =================== LẤY DANH SÁCH SẢN PHẨM VỚI BỘ LỌC =======================
@router.get("/products", response_model=Page)
async def get_products_filter(
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
    service: BuyerProductService = Depends(get_procduct_service),
):
    """
    Lấy danh sách sản phẩm cho người mua.

    - Tìm kiếm theo tên (q)
    - Lọc theo khoảng giá (min_price, max_price)
    - Lọc theo mức đánh giá
    - Hỗ trợ phân trang
    """
    return await service.get_buyer_products_filter(
        q=q,
        min_price=min_price,
        max_price=max_price,
        rating_filter=rating_filter,
        sort=sort,   # ✅ DÒNG QUAN TRỌNG
        limit=limit,
        offset=offset,
    )

# =================== LẤY GIÁ SẢN PHẨM THEO BIẾN THỂ VÀ KÍCH THƯỚC =======================
@router.post("/product/price", response_model=ProductPriceResponse)
async def product_price(
    payload: ProductPriceRequest,
    db: AsyncSession = Depends(get_db),
):
    service = BuyerProductService(db)
    return await service.get_product_price(
        product_id=payload.product_id,
        variant_id=payload.variant_id,
        size_id=payload.size_id,
    )
# =================== LẤY THÔNG TIN SHOP THEO SẢN PHẨM =======================
@router.get(
    "/products/{product_id}/shop",
    response_model=ShopInfoResponse,
)
async def get_shop_info(
    product_id: int,
    service: BuyerProductService = Depends(get_procduct_service),
):
    """
    Lấy thông tin shop hiển thị trong trang chi tiết sản phẩm
    """
    return await service.get_shop_info_by_product(product_id)


# =================== LẤY SẢN PHẨM THEO DANH MỤC =======================
@router.get("/categories/{category_id}")
async def get_products_by_category(
    category_id: int,
    q: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: BuyerProductService = Depends(get_procduct_service)
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
    service: BuyerProductService = Depends(get_procduct_service),
):
    """
    Lấy thông tin chi tiết của một sản phẩm.

    - Bao gồm hình ảnh, biến thể và size
    - Chỉ trả về sản phẩm đang bán
    - Trả 404 nếu không tồn tại
    """

    return await service.get_buyer_product_detail(product_id)


# =================== LẤY VARIANTS CỦA SẢN PHẨM =======================
@router.get("/{product_id}/variants", response_model=list[ProductVariantLiteResponse])
async def get_product_variants(
    product_id: int,
    service: BuyerProductService = Depends(get_procduct_service),
):
    """
    Lấy các biến thể (variants) của một sản phẩm.

    - Trả về danh sách biến thể 
    - Trả 404 nếu sản phẩm không tồn tại
    """

    return await service.get_product_variants(product_id)

# =================== LẤY SIZE THEO VARIANTS CỦA SẢN PHẨM =======================
@router.get("/{product_id}/variants/{variant_id}/sizes", response_model= ProductVariantWithSizesResponse)
async def get_variant_sizes(
    product_id: int,
    variant_id: int,
    service: BuyerProductService = Depends(get_procduct_service),
):
    """
    Lấy các kích thước (sizes) của một biến thể sản phẩm.

    - Trả về danh sách kích thước
    - Trả 404 nếu biến thể không tồn tại
    """

    return await service.get_variant_sizes(variant_id)    

