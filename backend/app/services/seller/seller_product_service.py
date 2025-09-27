from __future__ import annotations
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ...config.s3 import public_url
from ...models.catalog import Category, Product, ProductImage, ProductSize, ProductVariant
from ...models.order import OrderItem
from ...schemas.common import Page, PageMeta
from ...schemas.product import (
    ProductCreate,
    ProductDetail,
    ProductImageResponse,
    ProductList,
    ProductResponse,
    ProductSizeCreate,
    ProductSizeResponse,
    ProductSizeUpdate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
    ProductVariantWithSizesResponse,
)
from ...services.common.storage_service import delete_object, upload_many_via_backend, upload_via_backend
from sqlalchemy import func

# VALIDATION HELPERS
def ensure_product_ownership(db: Session, seller_id: int, product_id: int):
    """
    Kiem tra san pham co thuoc seller duoc dua vao khong
    """
    product = db.query(Product).filter(
        Product.product_id == product_id,
        Product.seller_id == seller_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return product


def ensure_variant_ownership(db: Session, product_id: int, variant_id: int):
    """
    Kiem tra variant co phai cua san pham hien tai khong
    """
    variant = db.query(ProductVariant).filter(
        ProductVariant.variant_id == variant_id,
        ProductVariant.product_id == product_id
    ).first()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found or doesn't belong to this product"
        )

    return variant


def ensure_size_ownership(db: Session, variant_id: int, size_id: int):
    """
    Kiem tra size co thuoc variant hien tai khong
    """
    size = db.query(ProductSize).filter(
        ProductSize.size_id == size_id,
        ProductSize.variant_id == variant_id
    ).first()

    if not size:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Size not found or doesn't belong to this variant"
        )

    return size

# ORDER CHECKING
def product_has_orders(db: Session, product_id: int):
    """Kiem tra san pham co order chua"""
    return db.query(OrderItem.order_item_id).filter(
        OrderItem.product_id == product_id
    ).first() is not None


def variant_has_orders(db: Session, variant_id: int) -> bool:
    """Kiem tra variant co don hang chua"""
    return db.query(OrderItem.order_item_id).filter(
        OrderItem.variant_id == variant_id
    ).first() is not None


def size_has_orders(db: Session, size_id: int) -> bool:
    """Kiem tra size co don hang chua"""
    return db.query(OrderItem.order_item_id).filter(
        OrderItem.size_id == size_id
    ).first() is not None

# CAC THAO TAC VE SAN PHAM
def get_seller_products(db: Session,
                        seller_id: int,
                        search_query: Optional[str] = None,
                        active_only: bool = False,
                        limit: int = 10,
                        offset: int = 0
):
    """
    Lay danh sach san pham cua seller co phan trang va tim kiem.

    Bien:
        db: Database session
        seller_id: ID cua seller
        search_query: Tu khoa tim kiem cho ten san pham (tuy chon)
        active_only: Neu True, chi tra ve san pham dang hoat dong
        limit: So san pham toi da tra ve
        offset: So san pham bo qua

    Tra ve:
        Page: Phan hoi co phan trang voi danh sach san pham
    """
    # Tao query co ban
    query = db.query(Product).options(joinedload(Product.category)).filter(
        Product.seller_id == seller_id
    )

    # Ap dung bo loc tim kiem
    if search_query and search_query.strip():
        query = query.filter(Product.name.ilike(f"%{search_query.strip()}%"))

    # Ap dung bo loc hoat dong
    if active_only:
        query = query.filter(Product.is_active.is_(True))

    # Lay tong so ban ghi
    total = query.count()

    # Lay ket qua co phan trang
    products = (
        query.order_by(Product.product_id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    # Lay anh chinh cho cac san pham
    product_ids = [p.product_id for p in products]
    primary_image_map = get_primary_images_map(db, product_ids)

    # Tao du lieu phan hoi
    data = []
    for product in products:
        base_product = ProductResponse.model_validate(product)
        data.append(ProductList(
            **base_product.model_dump(),
            category_name=product.category.category_name if product.category else None,
            public_primary_image_url=public_url(primary_image_map.get(product.product_id))
        ))

    return Page(
        meta=PageMeta(total=total, limit=limit, offset=offset),
        data=data
    )


def get_seller_product_detail(db: Session, seller_id: int, product_id: int):
    """
    Lay thong tin chi tiet ve san pham cua seller.
    """
    product = ensure_product_ownership(db, seller_id, product_id)

    # Lay hinh anh san pham
    images = db.query(ProductImage).filter(
        ProductImage.product_id == product_id
    ).order_by(
        ProductImage.is_primary.desc(),
        ProductImage.product_image_id.asc()
    ).all()

    image_responses = [
        ProductImageResponse(
            product_image_id=img.product_image_id,
            product_id=img.product_id,
            image_url=img.image_url,
            public_image_url=public_url(img.image_url),
            is_primary=img.is_primary
        )
        for img in images
    ]

    # Lay bien the va cac sizes
    variants = db.query(ProductVariant).options(
        joinedload(ProductVariant.sizes)
    ).filter(
        ProductVariant.product_id == product_id
    ).order_by(ProductVariant.variant_id.asc()).all()

    variant_responses = []
    for variant in variants:
        sorted_sizes = sorted(variant.sizes or [], key=lambda x: x.size_id)
        variant_responses.append(ProductVariantWithSizesResponse(
            variant_id=variant.variant_id,
            product_id=variant.product_id,
            variant_name=variant.variant_name,
            price_adjustment=variant.price_adjustment,
            sizes=[ProductSizeResponse.model_validate(size) for size in sorted_sizes]
        ))

    # Lay ten danh muc
    category_name = None
    if product.category_id:
        category_name = db.query(Category.category_name).filter(
            Category.category_id == product.category_id
        ).scalar()

    return ProductDetail(
        product_id=product.product_id,
        name=product.name,
        base_price=product.base_price,
        category_id=product.category_id,
        category_name=category_name,
        description=product.description,
        discount_percent=product.discount_percent,
        weight=product.weight,
        is_active=product.is_active,
        created_at=product.created_at.isoformat() if product.created_at else None,
        images=image_responses,
        variants=variant_responses
    )


def create_seller_product(db: Session, seller_id: int, payload: ProductCreate):
    """
    Tao san pham moi cho seller.
    """

    exist = db.query(Product.product_id).filter(
        Product.seller_id == payload.seller_id,
        Product.name.ilike(f"%{payload.name.strip()}%")
    )

    if exist:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product's name is already exists"
        )

    product = Product(
        name=payload.name,
        seller_id=seller_id,
        base_price=payload.base_price,
        category_id=payload.category_id,
        description=payload.description,
        discount_percent=payload.discount_percent or 0,
        weight=payload.weight,
        is_active=True
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return ProductResponse.model_validate(product)

def update_seller_product(db: Session,
                          seller_id: int,
                          product_id: int,
                          payload: ProductUpdate):
    """
    Cap nhat san pham hien co.
    """
    product = ensure_product_ownership(db, seller_id, product_id)

    # Chi cap nhat cac truong duoc cung cap
    update_fields = {
        'name': payload.name,
        'base_price': payload.base_price,
        'category_id': payload.category_id,
        'description': payload.description,
        'discount_percent': payload.discount_percent,
        'weight': payload.weight,
        'is_active': payload.is_active
    }

    for field, value in update_fields.items():
        if value is not None:
            setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return ProductResponse.model_validate(product)


def delete_seller_product(db: Session, seller_id: int, product_id: int):
    """
    Xoa mem san pham. Neu san pham co don hang thi vo hieu hoa, nguoc lai xoa hoan toan.
    """
    product = ensure_product_ownership(db, seller_id, product_id)

    if product_has_orders(db, product_id):
        # Xoa mem - vo hieu hoa san pham de bao ton lich su don hang
        if product.is_active:
            product.is_active = False
            db.commit()
        return {
            "deleted": False,
            "soft_deleted": True,
            "product_id": product_id
        }

    # Xoa cung - san pham khong co don hang
    db.delete(product)
    db.commit()

    return {
        "deleted": True,
        "soft_deleted": False,
        "product_id": product_id
    }

# VARIANT OPERATIONS
def create_product_variant(
        db: Session,
        seller_id: int,
        product_id: int,
        payload: ProductVariantCreate
):
    """
    Tao variant moi cho san pham
    """
    ensure_product_ownership(db, seller_id, product_id)

    name = (payload.variant_name or "").strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="variant_name is required")

    # chặn trùng (không phân biệt hoa/thường)
    exists = db.query(ProductVariant).filter(
        ProductVariant.product_id == product_id,
        func.lower(ProductVariant.variant_name) == name.lower()
    ).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Variant name already exists for this product")

    variant = ProductVariant(
        product_id=product_id,
        variant_name=payload.variant_name,
        price_adjustment=payload.price_adjustment or 0
    )

    db.add(variant)
    db.commit()
    db.refresh(variant)

    return ProductVariantResponse.model_validate(variant)


def update_product_variant(db: Session,
                           seller_id: int,
                           product_id: int,
                           variant_id: int,
                           payload: ProductVariantUpdate):
    """
    Update variant dang ton tai cua product.
    """
    ensure_product_ownership(db, seller_id, product_id)
    variant = ensure_variant_ownership(db, product_id, variant_id)

    if payload.variant_name is not None:
        name = (payload.variant_name or "").strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="variant_name cannot be empty"
            )

        # Kiểm tra trùng cùng product, loại trừ chính nó
        duplicate = db.query(ProductVariant).filter(
            ProductVariant.product_id == product_id,
            func.lower(ProductVariant.variant_name) == name.lower(),
            ProductVariant.variant_id != variant.variant_id,
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Variant name already exists for this product"
            )
        variant.variant_name = name

     # Cập nhật price_adjustment (schema đã ge=0 nên không cần check âm)
    if payload.price_adjustment is not None:
        variant.price_adjustment = payload.price_adjustment

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Phòng khi đụng unique index ở DB (case-insensitive)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Variant name already exists for this product"
        )

    db.refresh(variant)
    return ProductVariantResponse.model_validate(variant)


def delete_product_variant(
        db: Session,
        seller_id: int,
        product_id: int,
        variant_id: int
):
    """
    Xoa 1 product variant va tat ca size con cua no.
    """
    ensure_product_ownership(db, seller_id, product_id)
    variant = ensure_variant_ownership(db, product_id, variant_id)

    if variant_has_orders(db, variant_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete variant that is used in orders"
        )

    # xoa tat ca size con
    db.query(ProductSize).filter(
        ProductSize.variant_id == variant_id
    ).delete(synchronize_session=False)

    # Delete the variant
    db.delete(variant)
    db.commit()

    return {"deleted": True, "variant_id": variant_id}

# SIZE OPERATIONS
def create_variant_size(
        db: Session,
        seller_id: int,
        product_id: int,
        variant_id: int,
        payload: ProductSizeCreate
):
    """
    Tao moi size moi.
    """
    ensure_product_ownership(db, seller_id, product_id)
    ensure_variant_ownership(db, product_id, variant_id)

    name = (payload.size_name or "").strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="size_name is required")

    # Check trùng (case-insensitive)
    exists = db.query(ProductSize).filter(
        ProductSize.variant_id == variant_id,
        func.lower(ProductSize.size_name) == name.lower()
    ).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Size already exists for this variant")

    # Determine stock status
    available_units = payload.available_units or 0
    in_stock = payload.in_stock if payload.in_stock is not None else available_units > 0

    size = ProductSize(
        variant_id=variant_id,
        size_name=payload.size_name,
        available_units=available_units,
        in_stock=in_stock
    )

    db.add(size)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Size already exists for this variant")

    db.refresh(size)
    return ProductSizeResponse.model_validate(size)


def update_variant_size(
        db: Session,
        seller_id: int,
        product_id: int,
        variant_id: int,
        size_id: int,
        payload: ProductSizeUpdate
):
    """
    Cap nhat size
    """
    ensure_product_ownership(db, seller_id, product_id)
    ensure_variant_ownership(db, product_id, variant_id)
    size = ensure_size_ownership(db, variant_id, size_id)

    if payload.size_name is not None:
        name = (payload.size_name or "").strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="size_name cannot be empty"
            )

        # Kiem tra trung lap size
        dup = db.query(ProductSize).filter(
            ProductSize.variant_id == variant_id,
            func.lower(ProductSize.size_name) == name.lower(),
            ProductSize.size_id != size.size_id
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Size already exists for this variant"
            )
        size.size_name = name

    if payload.available_units is not None:
        if payload.available_units == 0:
            size.in_stock = False
        size.available_units = payload.available_units

    if payload.in_stock is not None:
        if payload.in_stock == 0:
            size.available_units = 0
        size.in_stock = payload.in_stock

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Size already exists for this variant"
        )

    db.refresh(size)
    return ProductSizeResponse.model_validate(size)


def delete_variant_size(
        db: Session,
        seller_id: int,
        product_id: int,
        variant_id: int,
        size_id: int
):
    """
    Ham xoa size.
    """
    ensure_product_ownership(db, seller_id, product_id)
    ensure_variant_ownership(db, product_id, variant_id)
    size = ensure_size_ownership(db, variant_id, size_id)

    if size_has_orders(db, size_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete size that is used in orders"
        )

    db.delete(size)
    db.commit()

    return {"deleted": True}


def get_variant_sizes(
        db: Session,
        seller_id: int,
        product_id: int,
        variant_id: int
) -> List[ProductSizeResponse]:
    """
    Tra ve tat ca size cua variant
    """
    ensure_product_ownership(db, seller_id, product_id)
    ensure_variant_ownership(db, product_id, variant_id)

    sizes = db.query(ProductSize).filter(
        ProductSize.variant_id == variant_id
    ).all()

    return [ProductSizeResponse.model_validate(size) for size in sizes]

# IMAGE
async def upload_product_image(
        db: Session,
        seller_id: int,
        product_id: int,
        file: UploadFile,
        is_primary: bool = False
):
    """
    Upload 1 anh.
    """
    ensure_product_ownership(db, seller_id, product_id)

    upload_result = await upload_via_backend('products', file, max_size_mb=5)
    image_url = upload_result['object_key']

    # Chinh sua primary neu anh tai len duoc chon lam anh chinh
    if is_primary:
        db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).update({'is_primary': False})

    image = ProductImage(
        product_id=product_id,
        image_url=image_url,
        is_primary=is_primary
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return ProductImageResponse(
        product_image_id=image.product_image_id,
        product_id=image.product_id,
        image_url=image.image_url,
        public_image_url=public_url(image.image_url),
        is_primary=image.is_primary
    )


async def upload_multiple_product_images(
        db: Session,
        seller_id: int,
        product_id: int,
        files: List[UploadFile],
        primary_index: Optional[int] = None
):
    """
    Upload nhieu anh.
    """
    ensure_product_ownership(db, seller_id, product_id)

    # Upload all images to storage
    upload_results = await upload_many_via_backend('products', files, max_size_mb=5)

    # If setting a primary image, unset current primary
    if primary_index is not None and 0 <= primary_index < len(upload_results):
        db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).update({"is_primary": False})

    # Create image records
    image_responses = []
    for index, result in enumerate(upload_results):
        image_url = result["object_key"]
        is_primary = primary_index is not None and index == primary_index

        image = ProductImage(
            product_id=product_id,
            image_url=image_url,
            is_primary=is_primary
        )

        db.add(image)
        db.flush()

        image_responses.append(ProductImageResponse(
            product_image_id=image.product_image_id,
            product_id=image.product_id,
            image_url=image.image_url,
            public_image_url=public_url(image.image_url),
            is_primary=image.is_primary
        ))

    db.commit()
    return image_responses


def set_primary_product_image(
        db: Session,
        seller_id: int,
        product_id: int,
        image_id: int
):
    """
    Chon 1 anh lam anh chinh.
    """
    ensure_product_ownership(db, seller_id, product_id)

    image = db.query(ProductImage).filter(
        ProductImage.product_image_id == image_id,
        ProductImage.product_id == product_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )

    # Bo set anh chinh cu
    db.query(ProductImage).filter(
        ProductImage.product_id == product_id,
        ProductImage.is_primary.is_(True)
    ).update({ProductImage.is_primary: False})

    # Set anh chinh hien tai
    image.is_primary = True
    db.commit()
    db.refresh(image)

    return ProductImageResponse(
        product_image_id=image.product_image_id,
        product_id=image.product_id,
        image_url=image.image_url,
        public_image_url=public_url(image.image_url),
        is_primary=True
    )


def delete_product_image(
        db: Session,
        seller_id: int,
        product_id: int,
        image_id: int
):
    """
    Xoa anh.
    """
    ensure_product_ownership(db, seller_id, product_id)

    image = db.query(ProductImage).filter(
        ProductImage.product_image_id == image_id,
        ProductImage.product_id == product_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )

    was_primary = bool(image.is_primary)

    # Xoa o phia minio
    try:
        delete_object(image.image_url)
    except Exception:
        pass

    db.delete(image)
    db.commit()

    # neu xoa anh chinh, set anh khac lam anh chinh
    if was_primary:
        next_image = db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).order_by(ProductImage.product_image_id.asc()).first()

        if next_image:
            next_image.is_primary = True
            db.commit()

    return {
        "deleted": True,
        "product_id": product_id,
        "product_image_id": image_id
    }

def get_primary_images_map(db: Session, product_ids: List[int]):
    """
    Map product id voi image url.
    """
    if not product_ids:
        return {}

    # Get primary images
    primary_images = db.query(
        ProductImage.product_id,
        ProductImage.image_url
    ).filter(
        ProductImage.product_id.in_(product_ids),
        ProductImage.is_primary.is_(True)
    ).all()

    primary_map = {product_id: image_url for product_id, image_url in primary_images}

    # Neu san pham khong co anh chinh, chon anh dau tien
    missing_product_ids = [pid for pid in product_ids if pid not in primary_map]

    if missing_product_ids:
        fallback_images = db.query(ProductImage).filter(
            ProductImage.product_id.in_(missing_product_ids)
        ).order_by(
            ProductImage.product_id.asc(),
            ProductImage.product_image_id.asc()
        ).all()

        for image in fallback_images:
            if image.product_id not in primary_map:
                primary_map[image.product_id] = image.image_url

    return primary_map