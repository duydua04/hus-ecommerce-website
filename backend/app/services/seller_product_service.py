from __future__ import annotations
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List

from ..models.order import OrderItem
from ..models.catalog import Product, ProductSize, ProductVariant, ProductImage

from ..schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse,
    ProductSizeCreate, ProductSizeUpdate, ProductSizeResponse,
    ProductImageResponse
)
from ..schemas.common import Page, PageMeta
from ..services.storage_service import upload_many_via_backend, upload_via_backend, delete_object
from ..config.s3 import public_url


def ensure_owner(db: Session, seller_id: int, product_id: int):
    # Kiem tra xem co product ung voi seller khong
    prod = db.query(Product).filter(Product.product_id == product_id, Product.seller_id == seller_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return prod

# Kiem tra xem san pham hien tai dang co don hang nao khong
def has_order_item(db: Session, product_id: int):
    return db.query(OrderItem.order_item_id).filter(OrderItem.product_id == product_id).first() is not None

def seller_create_product(db: Session, seller_id: int, payload: ProductCreate):
    # Ham cho seller tao san pham moi
    prod = Product(
        name=payload.name,
        seller_id=payload.seller_id,
        base_price=payload.base_price,
        category_id=payload.category_id,
        description=payload.description,
        discount_percent=payload.discount_percent or 0,
        weight=payload.weight,
        is_active=True
    )

    db.add(prod)
    db.commit()
    db.refresh(prod)

    return ProductResponse.model_validate(prod)


def seller_update_product(db: Session, seller_id: int, product_id: int, payload: ProductUpdate):
    """
    Update thong tin san pham
    """

    prod = ensure_owner(db, seller_id, product_id)
    if payload.name is not None:
        prod.name = payload.name
    if payload.base_price is not None:
        prod.base_price = payload.base_price
    if payload.category_id is not None:
        prod.category_id = payload.category_id
    if payload.description is not None:
        prod.description = payload.description
    if payload.discount_percent is not None:
        prod.discount_percent = payload.discount_percent
    if payload.weight is not None:
        prod.weight = payload.weight
    if payload.is_active is not None:
        prod.is_active = payload.is_active

    db.add(prod)
    db.commit()
    db.refresh(prod)
    return ProductResponse.model_validate(prod)

def seller_list_products(db: Session, seller_id: int, q: str | None, active_only: bool, limit: int, offset: int):
    """
    Ham list san pham o phia seller
    """

    # query co ban lay tat ca san pham cua seller
    query = db.query(Product).filter(Product.seller_id == seller_id)
    # Neu co tu khoa tim kiem thi thuc hien truy van
    if q:
        query = query.filter(Product.name.like(f"%{q.strip()}%"))
    # Neu san pham active thi thuc hien truy van
    if active_only:
        query = query.filter(Product.is_active.is_(True))

    # Dem tong so ban ghi, lay du lieu voi phan trang va chuyen doi ve response de tra ve
    total = query.count()
    prods = query.order_by(Product.product_id.desc()).limit(limit).offset(offset).all()
    data = [ProductResponse.model_validate(prod) for prod in prods]

    return Page(meta=PageMeta(total=total, limit=limit, offset=offset), data=data)

def seller_product_detail(db: Session, seller_id: int, product_id: int):
    prod = ensure_owner(db, seller_id, product_id)
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return ProductResponse.model_validate(prod)

def seller_soft_delete_product(db: Session, seller_id: int, product_id: int):
    """
    # Xoa mem san pham - de du lai lich su don hang
    """

    prod = ensure_owner(db, seller_id, product_id)

    prod.is_active = False
    db.add(prod)
    db.commit()

    return {"deleted": True, "product_id": prod.product_id, "mode": "soft"}

# ---IMAGE---
async def seller_upload_image_backend(db: Session, seller_id: int, product_id: int,
                                      file: UploadFile, is_primary: bool | None):
    ensure_owner(db, seller_id, product_id)
    # Upload anh len storage
    result = await upload_via_backend('products', file, max_size_mb=5)
    object_key = result['object_key']
    image_url = object_key
    public_image_url = public_url(image_url)
    # Neu anh upload duoc chon la primary
    if is_primary:
        db.query(ProductImage).filter(ProductImage.product_id == product_id).update({'is_primary': False})

    img = ProductImage(product_id=product_id, image_url=image_url, is_primary=bool(is_primary))
    db.add(img)
    db.commit()
    db.refresh(img)

    return ProductImageResponse(
        product_image_id=img.product_image_id,
        product_id=img.product_id,
        image_url=img.image_url,
        public_image_url=public_image_url,
        is_primary=img.is_primary
    )

async def seller_upload_many_images_backend(db: Session, seller_id: int, product_id: int,
                                           files: List[UploadFile], primary_index: int | None):
    ensure_owner(db, seller_id, product_id)
    results = await upload_many_via_backend('products', files, max_size_mb=5)

    # Neu co primary_index thi xoa anh primary truoc do
    if primary_index is not None and 0 <= primary_index < len(results):
        db.query(ProductImage).filter(ProductImage.product_id == product_id).update({"is_primary": False})

    """
    Tao danh sach rong, vong lap upload ket qua
    lay thong tin va set vao database      
    """
    outs: list[ProductImageResponse] = []
    for index, res in enumerate(results):
        image_url = res["object_key"]
        is_primary = (primary_index is not None and index == primary_index)
        img = ProductImage(product_id=product_id, image_url=image_url, is_primary=is_primary)
        db.add(img)
        db.flush()
        outs.append(ProductImageResponse(
            product_image_id=img.product_image_id,
            product_id=img.product_id,
            image_url=img.image_url,
            public_image_url=public_url(img.image_url),
            is_primary=img.is_primary,
        ))

    db.commit()
    return outs

def seller_set_primary_image(db: Session, seller_id: int, product_id: int, product_image_id: int):
    ensure_owner(db, seller_id, product_id)

    # Truy van trong database tim anh
    img = db.query(ProductImage).filter(
        ProductImage.product_image_id == product_image_id,
        ProductImage.product_id == product_id
    ).first()

    # Tra ve loi neu khong tim thay
    if not img:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    # Set tat ca ve is_primary la False sau do chuyen sang True
    db.query(ProductImage).filter(ProductImage.product_id == product_id).update({'is_primary': False})
    img.is_primary = True
    db.add(img)
    db.commit()

    return {"primary_set": True}

# Ham tra ve tat ca anh cua san pham
def seller_list_images_of_product(db: Session, seller_id: int, product_id: int):
    ensure_owner(db, seller_id, product_id)

    imgs = (db.query(ProductImage)
            .filter(ProductImage.product_id == product_id)
            .order_by(ProductImage.is_primary.desc(), ProductImage.product_image_id.asc())
            .all()
    )

    out: list[ProductImageResponse] = []
    for img in imgs:
        out.append(ProductImageResponse(
            product_image_id=img.product_image_id,
            product_id=img.product_id,
            image_url=img.image_url,
            public_image_url=public_url(img.image_url),
            is_primary=img.is_primary,
        ))

    return out

# Xoa anh cua san pham
def seller_delete_image_of_product(db: Session, seller_id: int, product_id: int, product_image_id):
    ensure_owner(db, seller_id, product_id)
    img = (db.query(ProductImage)
           .filter(ProductImage.product_image_id == product_image_id,
                   ProductImage.product_id == product_id)
           .first()
    )

    delete_object(img.image_url)
    db.delete(img)
    db.commit()

    return {"deleted": True}


# -----VARIANT------
# Ham tao bien the moi cho san phan
def seller_create_variant(db: Session, seller_id: int, product_id: int, payload: ProductVariantCreate):
    prod = ensure_owner(db, seller_id, product_id)
    variant = ProductVariant(
        product_id=product_id,
        variant_name=payload.variant_name,
        price_adjustment=payload.price_adjustment or 0
    )

    db.add(variant)
    db.commit()
    db.refresh(variant)

    return ProductVariantResponse.model_validate(variant)

def seller_update_variant(db: Session, seller_id: int, variant_id: int, payload: ProductVariantUpdate):
    variant = db.query(ProductVariant).filter(ProductVariant.variant_id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")

    ensure_owner(db, seller_id, variant.product_id)

    if payload.variant_name is not None:
        variant.variant_name = payload.variant_name

    if payload.price_adjustment is not None:
        variant.price_adjustment = payload.price_adjustment

    db.add(variant)
    db.commit()
    db.refresh(variant)

    return ProductVariantResponse.model_validate(variant)

def seller_delete_variant(db: Session, seller_id: int, variant_id: int):
    # Truy van tim bien the cua san pham
    variant = db.query(ProductVariant).filter(ProductVariant.variant_id == variant_id).first()
    if variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")

    prod = ensure_owner(db, seller_id, variant.product_id)

    """
    Kiem tra xem bien the hien tai da co don hang nao hay chua,
    Neu da co bao loi khong xoa duoc
    """
    used = db.query(OrderItem.order_item_id) \
            .filter((OrderItem.product_id == prod.product_id) & (OrderItem.variant_id == variant_id)) \
            .first()

    if used:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete variant because it's already used in orders")

    # Xoa cac size con cua bien the duoc yeu cau xoa
    size = db.query(ProductSize).filter(ProductSize.variant_id == variant_id).delete(synchronize_session=False)
    db.delete(variant)
    db.commit()
    return {"deleted": True}

#-----SIZE-----
def seller_create_size(db: Session, seller_id: int, payload: ProductSizeCreate):
    # Kiem tra xem co variant tuong ung voi size khong, khong co thi bao loi
    variant = db.query(ProductVariant).filter(ProductVariant.variant_id == payload.variant_id).first()
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")

    # Kiem tra va them size cho bien the
    ensure_owner(db, seller_id, variant.product_id)
    size = ProductSize(
        variant_id=variant.variant_id,
        size_name=payload.size_name,
        available_units=payload.available_units or 0,
        in_stock=payload.in_stock if payload.in_stock is not None else (payload.available_units or 0) > 0
    )

    db.add(size)
    db.commit()
    db.refresh(size)

    return ProductSizeResponse.model_validate(size)

def seller_update_size(db: Session, seller_id: int, size_id: int, payload: ProductSizeUpdate):
    size = db.query(ProductSize).filter(ProductSize.size_id == size_id).first()
    if not size:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Size not found")

    variant = db.query(ProductVariant).filter(ProductVariant.variant_id == size.variant_id).first()
    ensure_owner(db, seller_id, variant.product_id)

    if payload.size_name is not None:
        size.size_name = payload.size_name

    # Neu so luong ton kho set ve 0 thi thay doi ca ton kho
    if payload.available_units is not None:
        size.available_units = payload.available_units
        if payload.in_stock is None:
            size.in_stock = payload.available_units > 0

    # Neu ton kho = false thi doi so ca so luong ton kho ve 0
    if payload.in_stock is not None:
        if not payload.in_stock:
            size.available_units = 0

        size.in_stock = payload.in_stock

    db.add(size)
    db.commit()
    db.refresh(size)

    return ProductSizeResponse.model_validate(size)

def seller_delete_size(db: Session, seller_id: int, size_id: int):
    size = db.query(ProductSize).filter(ProductSize.size_id == size_id).first()
    if not size:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Size not found")

    variant = db.query(ProductVariant).filter(ProductVariant.variant_id == size.variant_id).first()
    prod = ensure_owner(db, seller_id, variant.product_id)

    """ 
    Kiem tra xem co don hang nao voi size nay chua
    Neu co bao loi khong the xoa
    """
    used = db.query(OrderItem.order_item_id) \
        .filter((OrderItem.product_id == prod.product_id) &
                (OrderItem.variant_id == variant.variant_id) &
                (OrderItem.size_id == size.size_id)
        ).first()
    if used:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete size because it's already used in orders")

    db.delete(size)
    db.commit()

    return {"deleted": True}