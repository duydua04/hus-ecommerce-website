from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status

from sqlalchemy.orm import Session
from ...config.s3 import public_url
from ...models import Product
from ...models.users import Seller, Buyer
from ...schemas import Page, PageMeta
from ...schemas.user import SellerResponse, BuyerResponse

def list_buyers(db: Session,
               search_query: Optional[str] | None,
               active_only: bool = False,
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
        query = query.filter(Product.is_active.is_(True))

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
            avt_url=public_url(b.avt_url),
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

