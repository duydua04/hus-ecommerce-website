"""
API routes quan ly san pham cua seller.

Module nay dinh nghia tat ca cac endpoint API cho cac thao tac san pham cua seller
bao gom san pham, bien the, kich co va quan ly hinh anh voi cau truc URL nested.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from ..config.db import get_db
from ..middleware.auth import require_seller
from ..schemas.common import Page
from ..schemas.product import (
    ProductCreate,
    ProductDetail,
    ProductImageResponse,
    ProductResponse,
    ProductSizeCreate,
    ProductSizeResponse,
    ProductSizeUpdate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
)
from ..services.seller_product_service import (
    create_product_variant,
    create_seller_product,
    create_variant_size,
    delete_product_image,
    delete_product_variant,
    delete_seller_product,
    delete_variant_size,
    get_seller_product_detail,
    get_seller_products,
    get_variant_sizes,
    set_primary_product_image,
    update_product_variant,
    update_seller_product,
    update_variant_size,
    upload_multiple_product_images,
    upload_product_image,
)

router = APIRouter(
    prefix="/seller/products",
    tags=["seller-products"]
)

# PRODUCT ENDPOINTS
@router.get("/", response_model=Page)
def list_my_products(
    seller_info=Depends(require_seller),
    q: Optional[str] = Query(None, description="Search query for product names"),
    active_only: bool = Query(False, description="Filter to show only active products"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of products to return"),
    offset: int = Query(0, ge=0, description="Number of products to skip"),
    db: Session = Depends(get_db)
):
    """API tra ve list san pham"""
    return get_seller_products(
        db=db,
        seller_id=seller_info['user'].seller_id,
        search_query=q,
        active_only=active_only,
        limit=limit,
        offset=offset
    )


@router.get("/{product_id}", response_model=ProductDetail)
def get_product_details(
    product_id: int,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Tra ve thong tin san pham chi tiet"""
    return get_seller_product_detail(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id
    )


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, seller_info=Depends(require_seller), db: Session = Depends(get_db)):
    """API tao san pham"""
    return create_seller_product(
        db=db,
        seller_id=seller_info['user'].seller_id,
        payload=payload
    )

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int,
    payload: ProductUpdate,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Update san pham"""
    return update_seller_product(
        db=db,
        seller_id=seller_info['user'].seller_id,
        product_id=product_id,
        payload=payload
    )


@router.delete("/{product_id}")
def soft_delete_product(product_id: int, seller_info=Depends(require_seller), db: Session = Depends(get_db)):
    """API xoa san pham"""
    return delete_seller_product(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id
    )

# VARIANT ENDPOINTS
@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def create_variant(
    product_id: int,
    payload: ProductVariantCreate,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Tao variant moi"""
    return create_product_variant(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        payload=payload
    )


@router.put("/{product_id}/variants/{variant_id}", response_model=ProductVariantResponse)
def update_variant(
    product_id: int,
    variant_id: int,
    payload: ProductVariantUpdate,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
) -> ProductVariantResponse:
    """Update an existing product variant."""
    return update_product_variant(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id,
        payload=payload
    )


@router.delete("/{product_id}/variants/{variant_id}", status_code=status.HTTP_200_OK)
def delete_variant(
    product_id: int,
    variant_id: int,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """API Xoa variant"""
    return delete_product_variant(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id
    )


# SIZE ENDPOINTS
@router.get("/{product_id}/variants/{variant_id}/sizes", response_model=List[ProductSizeResponse])
def list_variant_sizes(
    product_id: int,
    variant_id: int,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Tra ve size"""
    return get_variant_sizes(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id
    )


@router.post("/{product_id}/variants/{variant_id}/sizes", response_model=ProductSizeResponse, status_code=status.HTTP_201_CREATED)
def create_size(
    product_id: int,
    variant_id: int,
    payload: ProductSizeCreate,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Tao size moi"""
    return create_variant_size(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id,
        payload=payload
    )


@router.put("/{product_id}/variants/{variant_id}/sizes/{size_id}", response_model=ProductSizeResponse)
def update_size(
    product_id: int,
    variant_id: int,
    size_id: int,
    payload: ProductSizeUpdate,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Update size"""
    return update_variant_size(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id,
        size_id=size_id,
        payload=payload
    )


@router.delete("/{product_id}/variants/{variant_id}/sizes/{size_id}")
def delete_size(
    product_id: int,
    variant_id: int,
    size_id: int,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """API xoa size."""
    return delete_variant_size(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id,
        size_id=size_id
    )


# IMAGE
@router.post("/{product_id}/images", response_model=ProductImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    product_id: int,
    file: UploadFile = File(..., description="Image file to upload"),
    is_primary: bool = Query(False, description="Set this image as primary"),
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Upload 1 anh"""
    return await upload_product_image(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        file=file,
        is_primary=is_primary
    )


@router.post("/{product_id}/images/batch", response_model=List[ProductImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_multiple_images(
    product_id: int,
    files: List[UploadFile] = File(..., description="List of image files to upload"),
    primary_index: Optional[int] = Query(None, description="Index of image to set as primary (0-based)"),
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Upload nhieu anh"""
    return await upload_multiple_product_images(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        files=files,
        primary_index=primary_index
    )


@router.patch("/{product_id}/images/{image_id}/set-primary", response_model=ProductImageResponse)
def set_primary(
    product_id: int,
    image_id: int,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Set anh chinh."""
    return set_primary_product_image(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        image_id=image_id
    )


@router.delete("/{product_id}/images/{image_id}")
def remove_image(
    product_id: int,
    image_id: int,
    seller_info=Depends(require_seller),
    db: Session = Depends(get_db)
):
    """Xoa anh"""
    return delete_product_image(
        db=db,
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        image_id=image_id
    )