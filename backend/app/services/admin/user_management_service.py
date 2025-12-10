from __future__ import annotations
from typing import Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .user_query_base import UserQueryBase

from ...config.db import get_db
from ...config.s3 import public_url
from ...models.users import Seller, Buyer
from ...schemas.common import Page, PageMeta
from ...schemas.user import SellerResponse, BuyerResponse


class AdminUserManagementService(UserQueryBase):

    def __init__(self, db: AsyncSession):
        super().__init__(db)


    async def list_buyers(
            self, search_query: Optional[str] = None,
            active_only: bool = True, limit: int = 10,
            offset: int = 0
    ):
        """Lấy danh sách Buyer"""

        total, buyers = await self._get_list_query_and_count(
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
                is_active=b.is_active,
                created_at=b.created_at,
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


    async def list_sellers(
            self, search_query: Optional[str] = None,
            active_only: bool = False, limit: int = 10,
            offset: int = 0
    ):
        """Lấy danh sách Seller"""
        total, sellers = await self._get_list_query_and_count(
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


    async def soft_delete_buyer(self, buyer_id: int):
        buyer = await self.db.get(Buyer, buyer_id)
        if not buyer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Buyer not found"
            )

        buyer.is_active = False
        await self.db.commit() # [ASYNC] Commit
        await self.db.refresh(buyer) # [ASYNC] Refresh

        return {"deleted": True, "mode": "soft_delete"}


    async def soft_delete_seller(self, seller_id: int):
        seller = await self.db.get(Seller, seller_id)
        if not seller:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller not found"
            )

        seller.is_active = False
        await self.db.commit()
        await self.db.refresh(seller)

        return {"deleted": True, "mode": "soft_deleted"}


def get_admin_user_management_service(db: AsyncSession = Depends(get_db)):
    return AdminUserManagementService(db)