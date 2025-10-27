from __future__ import annotations
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ...models.users import Seller
from ...config.s3 import public_url
from ...schemas.user import SellerResponse, SellerUpdate


def _phone_taken_by_other_seller(db: Session, phone: str, my_id: int):
    # Kiem tra xem co bi trung so dien thoai hay khong
    if not phone:
        return False
    q = db.query(Seller).filter(Seller.phone == phone, Seller.seller_id != my_id)
    return db.query(q.exists()).scalar()


def get_current_seller_info(seller_id: int, db: Session):
    current_seller = db.query(Seller).filter(Seller.seller_id == seller_id).first()

    if not current_seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller could not found"
        )

    return SellerResponse(
        seller_id=current_seller.seller_id,
        email=current_seller.email,
        phone=current_seller.phone,
        fname=current_seller.fname,
        lname=current_seller.lname,
        shop_name=current_seller.shop_name,
        seller_tier=current_seller.seller_tier,
        avt_url=public_url(current_seller.avt_url),
        average_rating=current_seller.average_rating,
        rating_count=current_seller.rating_count,
        is_active=current_seller.is_active,
        created_at=current_seller.created_at
    )


def update_current_seller(db: Session, seller_id: int, payload: SellerUpdate):
    seller = db.query(Seller).filter(Seller.seller_id == seller_id).first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )

    # Kiem tra
    if payload.phone is not None:
        if _phone_taken_by_other_seller(db, payload.phone, seller_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is already used by another seller"
            )
        seller.phone = payload.phone

    if payload.fname is not None:
        seller.fname = payload.fname
    if payload.lname is not None:
        seller.lname = payload.lname
    if payload.shop_name is not None:
        seller.shop_name = payload.shop_name

    db.commit()
    db.refresh(seller)

    return SellerResponse(
        seller_id=seller.seller_id,
        email=seller.email,
        phone=seller.phone,
        fname=seller.fname,
        lname=seller.lname,
        shop_name=seller.shop_name,
        seller_tier=seller.seller_tier,
        avt_url=public_url(seller.avt_url),
        average_rating=seller.average_rating,
        rating_count=seller.rating_count,
        is_active=seller.is_active,
        created_at=seller.created_at
    )
