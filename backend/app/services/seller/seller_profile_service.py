from __future__ import annotations
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.users import Seller
from ...config.s3 import public_url
from ...config.db import get_db
from ...schemas.user import SellerResponse, SellerUpdate


class SellerProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _phone_taken_by_other(self, phone: str, my_id: int):
        """Kiểm tra số điện thoại đã bị seller khác sử dụng chưa (Async)"""
        if not phone:
            return False

        # Select 1 dòng có phone trùng và ID khác mình
        stmt = select(Seller.seller_id).where(
            Seller.phone == phone,
            Seller.seller_id != my_id
        ).limit(1)

        result = await self.db.execute(stmt)
        return result.first() is not None


    @staticmethod
    def _to_response(seller: Seller):
        """Hàm map dữ liệu"""
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


    async def _get_seller_or_404(self, seller_id: int):
        """Helper tìm seller (Async)"""
        seller = await self.db.get(Seller, seller_id)
        if not seller:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller not found"
            )
        return seller


    async def get_info(self, seller_id: int):
        """Lấy thông tin hồ sơ seller"""
        seller = await self._get_seller_or_404(seller_id)
        return self._to_response(seller)


    async def update_info(self, seller_id: int, payload: SellerUpdate):
        """Cập nhật thông tin hồ sơ seller"""
        seller = await self._get_seller_or_404(seller_id)

        if payload.phone is not None:
            # Nếu phone mới khác phone cũ thì mới check DB
            if payload.phone != seller.phone:
                if await self._phone_taken_by_other(payload.phone, seller_id):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Phone number is already used by another seller"
                    )
                seller.phone = payload.phone

        # 2. Update các trường khác
        if payload.fname is not None:
            seller.fname = payload.fname
        if payload.lname is not None:
            seller.lname = payload.lname
        if payload.shop_name is not None:
            seller.shop_name = payload.shop_name

        await self.db.commit()
        await self.db.refresh(seller)

        return self._to_response(seller)


def get_seller_profile_service(db: AsyncSession = Depends(get_db)):
    return SellerProfileService(db)