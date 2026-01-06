from typing import List, Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from ...middleware.auth import require_seller

from ...schemas.common import Page
from ...schemas.product import (
    ProductCreate, ProductDetail, ProductImageResponse, ProductResponse,
    ProductSizeCreate, ProductSizeResponse, ProductSizeUpdate, ProductUpdate,
    ProductVariantCreate, ProductVariantResponse, ProductVariantUpdate,
)

from ...services.seller.seller_product_service import (
    SellerProductService,
    get_seller_product_service
)

router = APIRouter(
    prefix="/seller/products",
    tags=["seller-products"]
)

@router.get("", response_model=Page)
async def list_my_products(
    q: Optional[str] = Query(None),
    active_only: bool = Query(True),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.get_products(
        seller_id=seller_info['user'].seller_id,
        search=q,
        active_only=active_only,
        limit=limit,
        offset=offset
    )


@router.get("/{product_id}", response_model=ProductDetail)
async def get_product_details(
    product_id: int,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.get_detail(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.create_product(
        seller_id=seller_info['user'].seller_id,
        payload=payload
    )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.update_product(
        seller_id=seller_info['user'].seller_id,
        product_id=product_id,
        payload=payload
    )


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.delete_product(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id
    )


@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
async def create_variant(
    product_id: int,
    payload: ProductVariantCreate,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.create_variant(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        payload=payload
    )


@router.put("/{product_id}/variants/{variant_id}", response_model=ProductVariantResponse)
async def update_variant(
    product_id: int,
    variant_id: int,
    payload: ProductVariantUpdate,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.update_variant(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id,
        payload=payload
    )


@router.delete("/{product_id}/variants/{variant_id}")
async def delete_variant(
    product_id: int,
    variant_id: int,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.delete_variant(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id
    )


@router.get("/{product_id}/variants/{variant_id}/sizes", response_model=List[ProductSizeResponse])
async def list_sizes(
    product_id: int,
    variant_id: int,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.get_variant_sizes(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id
    )


@router.post("/{product_id}/variants/{variant_id}/sizes", response_model=ProductSizeResponse, status_code=status.HTTP_201_CREATED)
async def create_size(
    product_id: int,
    variant_id: int,
    payload: ProductSizeCreate,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.create_size(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id,
        payload=payload
    )


@router.put("/{product_id}/variants/{variant_id}/sizes/{size_id}", response_model=ProductSizeResponse)
async def update_size(
    product_id: int,
    variant_id: int,
    size_id: int,
    payload: ProductSizeUpdate,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):
    return await service.update_size(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id,
        size_id=size_id,
        payload=payload
    )


@router.delete("/{product_id}/variants/{variant_id}/sizes/{size_id}")
async def delete_size(
    product_id: int,
    variant_id: int,
    size_id: int,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):
    return await service.delete_size(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        variant_id=variant_id,
        size_id=size_id
    )


@router.post("/{product_id}/images", response_model=List[ProductImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_images(
    product_id: int,
    files: List[UploadFile] = File(...),
    primary_index: Optional[int] = Query(None),
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):
    return await service.upload_images(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        files=files,
        primary_index=primary_index
    )


@router.patch("/{product_id}/images/{image_id}/primary", response_model=ProductImageResponse)
async def set_primary_image(
    product_id: int,
    image_id: int,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.set_primary_image(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        image_id=image_id
    )


@router.delete("/{product_id}/images/{image_id}")
async def delete_image(
    product_id: int,
    image_id: int,
    seller_info=Depends(require_seller),
    service: SellerProductService = Depends(get_seller_product_service)
):

    return await service.delete_image(
        seller_id=seller_info["user"].seller_id,
        product_id=product_id,
        image_id=image_id
    )