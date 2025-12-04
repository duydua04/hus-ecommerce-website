from __future__ import annotations
from typing import Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session

from .user_query_base import UserQueryBase

from ...config.db import get_db
from ...config.s3 import public_url
from ...models.users import Seller, Buyer
from ...schemas.common import Page, PageMeta
from ...schemas.user import SellerResponse, BuyerResponse


class AdminUserManagementService(UserQueryBase):

    def list_buyers(
            self, search_query: Optional[str] = None,
            active_only: bool = True, limit: int = 10,
            offset: int = 0
    ):
        """Lấy danh sách Buyer"""

        total, buyers = self._get_list_query_and_count(
            model=Buyer,
            search_query=search_query,
            active_only=active_only,
            limit=limit,
            offset=offset,
            is_seller=False
        )

        data = [
            BuyerResponse(
                buyer_id=b.buyer_id,
                email=b.email,
                phone=b.phone,
                fname=b.fname,
                lname=b.lname,
                avt_url=public_url(b.avt_url) if b.avt_url else None,
                buyer_tier=b.buyer_tier,
                is_active=b.is_active, created_at=b.created_at,
            ) for b in buyers
        ]

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )


    def list_sellers(
            self, search_query: Optional[str] = None,
            active_only: bool = False, limit: int = 10,
            offset: int = 0
    ):
        """Lấy danh sách Seller"""
        total, sellers = self._get_list_query_and_count(
            model=Seller,
            search_query=search_query,
            active_only=active_only,
            limit=limit,
            offset=offset,
            is_seller=True
        )

        data = [
            SellerResponse(
                seller_id=s.seller_id,
                email=s.email,
                phone=s.phone,
                fname=s.fname,
                lname=s.lname,
                shop_name=s.shop_name,
                seller_tier=s.seller_tier,
                avt_url=public_url(s.avt_url) if s.avt_url else None,
                average_rating=s.average_rating,
                rating_count=s.rating_count,
                is_active=s.is_active,
                created_at=s.created_at
            ) for s in sellers
        ]

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
            data=data
        )


    def soft_delete_buyer(self, buyer_id: int):
        buyer = self.db.query(Buyer).get(buyer_id)
        if not buyer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Buyer not found"
            )

        buyer.is_active = False
        self.db.commit()
        self.db.refresh(buyer)

        return {"deleted": True, "mode": "soft_delete"}


    def soft_delete_seller(self, seller_id: int):
        seller = self.db.query(Seller).get(seller_id)
        if not seller:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller not found"
            )

        seller.is_active = False
        self.db.commit()
        self.db.refresh(seller)

        return {"deleted": True, "mode": "soft_deleted"}


def get_admin_user_management_service(db: Session = Depends(get_db)) -> AdminUserManagementService:
    return AdminUserManagementService(db)