from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status

from sqlalchemy.orm import Session
from ...config.s3 import public_url
from ...models.users import Seller, Buyer
from ...schemas import Page, PageMeta
from ...schemas.user import SellerResponse, BuyerResponse

def list_buyers(db: Session,
               search_query: Optional[str] | None,
               active_only: bool = True,
               limit: int = 10,
               offset: int = 10):

    # query co ban quyery den
    query = db.query(Buyer)

    # Neu co tu khoa tim kiem
    if search_query and search_query.strip():
        query = query.filter(Buyer.lname.ilike(f"%{search_query.strip()}%") |
                             Buyer.fname.ilike(f"%{search_query.strip()}%")
        )

    # Neu chi lay tai khoan buyer dang hoat dong
    if active_only:
        query = query.filter(Buyer.is_active.is_(True))

    total = query.count()

    # Sap xep theo tao gan day nhat
    buyers = query \
        .order_by(Buyer.created_at.desc()) \
        .limit(limit) \
        .offset(offset)

    data  = []
    for b in buyers:
        buyer = BuyerResponse(
            buyer_id=b.buyer_id,
            email= b.email,
            phone=b.phone,
            fname=b.fname,
            lname=b.lname,
            avt_url=public_url(b.avt_url) if b.avt_url else None,
            buyer_tier=b.buyer_tier,
            is_active=b.is_active,
            created_at=b.created_at,
        )

        data.append(buyer)

    return Page(
        meta=PageMeta(
            total=total,
            limit=limit,
            offset=offset
        ),
        data=data
    )

def list_sellers(db: Session,
               search_query: Optional[str] | None,
               active_only: bool = False,
               limit: int = 10,
               offset: int = 10):

    # query co ban quyery den
    query = db.query(Seller)

    # Neu co tu khoa tim kiem theo ho, ten, ten shop
    if search_query and search_query.strip():
        query = query.filter(Seller.lname.ilike(f"%{search_query.strip()}%") |
                             Seller.fname.ilike(f"%{search_query.strip()}%") |
                             Seller.shop_name.ilike(f"%{search_query.strip()}%")
        )

    # Neu chi lay tai khoan buyer dang hoat dong
    if active_only:
        query = query.filter(Seller.is_active.is_(True))

    total = query.count()

    # Sap xep theo tao gan day nhat
    sellers = query \
        .order_by(Seller.created_at.desc()) \
        .limit(limit) \
        .offset(offset)

    data  = []
    for s in sellers:
        seller = SellerResponse(
            seller_id=s.seller_id,
            email=s.email,
            phone=s.phone,
            fname=s.fname,
            lname=s.lname,
            shop_name=s.shop_name,
            seller_tier=s.seller_tier,
            avt_url=public_url(s.avt_url) if s.avt_url else None,
            description=s.description,
            average_rating=s.average_rating,
            rating_count=s.rating_count,
            is_verified=s.is_verified,
            is_active=s.is_active,
            created_at=s.created_at
        )

        data.append(seller)

    return Page(
        meta=PageMeta(
            total=total,
            limit=limit,
            offset=offset
        ),
        data=data
    )

def soft_delete_buyer(db: Session, buyer_id: int):
    buyer = db.query(Buyer).get(buyer_id)
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buyer not found"
        )

    buyer.is_active = False
    db.commit()
    db.refresh(buyer)

    return {"deleted": True, "mode": "soft_delete"}

def soft_delete_seller(db: Session, seller_id: int):
    seller = db.query(Seller).get(seller_id)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )

    seller.is_active = False
    db.commit()
    db.refresh(seller)

    return {"deleted": True, "mode": "soft_deleted"}