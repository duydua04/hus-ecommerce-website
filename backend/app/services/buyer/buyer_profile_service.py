from __future__ import annotations
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.users import Buyer
from ...config.s3 import public_url
from ...config.db import get_db
from ...schemas.user import BuyerResponse, BuyerUpdate


class BuyerProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== KIỂM TRA SỐ ĐIỆN THOẠI ====================
    async def _phone_taken_by_other(self, phone: str, my_id: int):
        """Kiểm tra số điện thoại đã bị buyer khác sử dụng chưa"""
        if not phone:
            return False

        stmt = (
            select(Buyer.buyer_id)
            .where(
                Buyer.phone == phone,
                Buyer.buyer_id != my_id
            )
            .limit(1)
        )

        result = await self.db.execute(stmt)
        return result.first() is not None

    @staticmethod
    def _to_response(buyer: Buyer):
        """Map Buyer -> BuyerResponse"""
        return BuyerResponse(
            buyer_id=buyer.buyer_id,
            email=buyer.email,
            phone=buyer.phone,
            fname=buyer.fname,
            lname=buyer.lname,
            avt_url=public_url(buyer.avt_url),
            buyer_tier=buyer.buyer_tier,   # ✅ BẮT BUỘC
            is_active=buyer.is_active,
            created_at=buyer.created_at
        )

    async def _get_buyer_or_404(self, buyer_id: int):
        """Helper tìm buyer"""
        buyer = await self.db.get(Buyer, buyer_id)
        if not buyer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Buyer not found"
            )
        return buyer

    async def get_info(self, buyer_id: int):
        """Lấy thông tin hồ sơ buyer"""
        buyer = await self._get_buyer_or_404(buyer_id)
        return self._to_response(buyer)

    async def update_info(self, buyer_id: int, payload: BuyerUpdate):
        """Cập nhật hồ sơ buyer"""
        buyer = await self._get_buyer_or_404(buyer_id)

        # 1. Phone
        if payload.phone is not None:
            if payload.phone != buyer.phone:
                if await self._phone_taken_by_other(payload.phone, buyer_id):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Phone number is already used by another buyer"
                    )
                buyer.phone = payload.phone

        # 2. Các field khác
        if payload.fname is not None:
            buyer.fname = payload.fname
        if payload.lname is not None:
            buyer.lname = payload.lname
        if payload.avt_url is not None:
            buyer.avt_url = public_url(payload.avt_url) # Lưu object key           
        await self.db.commit()
        await self.db.refresh(buyer)

        return self._to_response(buyer)


def get_buyer_profile_service(
    db: AsyncSession = Depends(get_db)
):
    return BuyerProfileService(db)
