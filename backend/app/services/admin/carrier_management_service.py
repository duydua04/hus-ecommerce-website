from __future__ import annotations
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from ...models import Carrier
from ...models import Order
from ...schemas.carrier import CarrierCreate, CarrierUpdate, CarrierOut
from ...utils.storage import upload_via_backend
from ...config.s3 import public_url

def ensure_unique_name(db: Session, name: str, exclude_id: int | None = None):
    """
    Đảm bảo không có carrier nào đang active trùng tên (không phân biệt hoa thường).
    exclude_id: bỏ qua carrier_id này khi update
    """
    query = db.query(Carrier).filter(
        func.lower(Carrier.carrier_name) == func.lower(name),
        Carrier.is_active == True
    )
    if exclude_id:
        query = query.filter(Carrier.carrier_id != exclude_id)

    dup = query.first()
    if dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Carrier name already exists"
        )

def carrier_to_out_public(c: Carrier):
    return CarrierOut(
        carrier_id=c.carrier_id,
        carrier_name=c.carrier_name,
        carrier_avt_url=public_url(c.carrier_avt_url) if c.carrier_avt_url else None,
        base_price=c.base_price,
        price_per_kg=c.price_per_kg,
        is_active=c.is_active,
    )

def get_carrier_or_404(db: Session, carrier_id: int):
    """Tra ve don vi van chuyen hien tai hoac bao loi"""
    carr = db.get(Carrier, carrier_id)
    if not carr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carrier not found"
        )

    return carr

def carrier_has_order(db: Session, carrier_id: int):
    """Kiem tra nha van chuyen nay co don hang nao khong"""
    return (db.query(Order.order_id)
            .filter(Order.carrier_id == carrier_id)
    ).first() is not None

def list_active_carrier(db: Session, q: str | None = None):
    """List ra danh sach cac don vi van chuyen dang duoc hoat dong"""
    query = db.query(Carrier).filter(Carrier.is_active == True)
    if q:
        query = query.filter(Carrier.carrier_name.ilike(f"%{q.strip()}%"))

    carriers = query.order_by(Carrier.carrier_name.asc()).all()
    return [carrier_to_out_public(carrier) for carrier in carriers]

async def create_carrier(
        db: Session,
        payload: CarrierCreate,
):
    """
    Ham them don vi van chuyen moi
    """
    # Bat buoc dien ten
    name = payload.carrier_name.strip()
    if not name:
        raise HTTPException(
            status_code=400,
            detail="Carrier name is required"
        )

    # Kiem tra co trung ten hay khong
    ensure_unique_name(db, name)

    # Tao va them carrier vao database
    carrier = Carrier(
        carrier_name=name,
        carrier_avt_url=None,
        base_price=payload.base_price,
        price_per_kg=payload.price_per_kg,
        is_active=True if payload.is_active is None else payload.is_active
    )

    try:
        db.add(carrier)
        db.commit()
        db.refresh(carrier)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Create carrier failed")

    return carrier_to_out_public(carrier)

def update_carrier(db: Session, carrier_id: int, payload: CarrierUpdate):
    carrier = get_carrier_or_404(db, carrier_id)

    # Tien hanh kiem tra va update
    if payload.carrier_name is not None:
        new_name = payload.carrier_name.strip()
        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Carrier name cannot be empty"
            )
        # Kiem tra ten update co trung voi ten da ton tai ko
        if new_name.lower() != carrier.carrier_name.lower():
           ensure_unique_name(db, new_name, exclude_id=carrier.carrier_id)
           carrier.carrier_name = new_name

        if payload.base_price is not None:
            carrier.base_price = payload.base_price
        if payload.price_per_kg is not None:
            carrier.price_per_kg = payload.price_per_kg
        if payload.is_active is not None:
            carrier.is_active = payload.is_active

        db.commit()
        db.refresh(carrier)

        return carrier_to_out_public(carrier)

async def update_carrier_avatar(
    db: Session,
    carrier_id: int,
    avatar_file: UploadFile,
    max_avt_size: int = 2,
):
    """Upload avatar cua don vi van chuyen"""
    c = get_carrier_or_404(db, carrier_id)
    res = await upload_via_backend("avatars", avatar_file, max_size_mb=max_avt_size)
    c.carrier_avt_url = res["object_key"]  # Lưu KEY
    db.commit()
    db.refresh(c)
    return carrier_to_out_public(c)

def delete_carrier(db: Session, carrier_id: int):
    """Neu chua co don hang thi xoa cung, co thi xoa mem"""
    carrier = get_carrier_or_404(db, carrier_id)

    if carrier_has_order(db, carrier_id):
        carrier.is_active = False
        db.commit()
        return {
            "deleted": True,
            "soft_deleted": True,
            "carrier_id": carrier.carrier_id,
            "is_active": carrier.is_active
        }

    db.delete(carrier)
    db.commit()

    return {
        "deleted": True,
        "soft_delete":False,
        "carrier_id": carrier_id
    }

