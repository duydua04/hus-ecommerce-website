from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from ..common.discount_service import BaseDiscountService
from ...models.catalog import Discount
from ...schemas.discount import DiscountResponse
from ...config.db import get_db
from fastapi import Depends
from datetime import datetime, date
from ...schemas.common import Page, PageMeta
from sqlalchemy import select, func
from fastapi import HTTPException, status

class DiscountService(BaseDiscountService):
    # =============== ĐƯA RA DANH SÁCH MÃ GIẢM GIÁ =================
    async def list(
        self,
        q: Optional[str],
        limit: int = 10,
        offset: int = 0
    ):
        stmt = select(Discount)

        if q and q.strip():
            stmt = stmt.where(
                Discount.code.ilike(f"%{q.strip()}%")
            )

        return await self._build_list_response(
            stmt=stmt,
            limit=limit,
            offset=offset
        )

    # =================== ĐƯA RA THÔNG TIN CHI TIẾT MÃ GIẢM GIÁ ==================
    async def get_detail(self, discount_id: int):
        discount = await self._get_discount_or_404(discount_id)
        return DiscountResponse.model_validate(discount)
    

    # ===================== ĐƯA RA CÁC MÃ GIẢM GIÁ CÓ THỂ ÁP DỤNG CHO ĐƠN HÀNG ===================
    async def list_available(
        self,
        cart_total: int,
        q: Optional[str],
        limit: int,
        offset: int
    ):
        now = date.today()

        stmt = select(Discount).where(
            Discount.is_active == True,
            Discount.start_date <= now,
            Discount.end_date >= now,
            Discount.min_order_value <= cart_total,
            Discount.usage_limit > Discount.used_count
        )

        if q:
            stmt = stmt.where(Discount.code.ilike(f"%{q}%"))

        # COUNT
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.scalar(count_stmt)

        # ORDER + PAGINATION
        remaining = Discount.usage_limit - Discount.used_count 

        stmt = (
            stmt
            .order_by(
                remaining.asc(),          # sắp hết lượt
                Discount.end_date.asc()   # sắp hết hạn
            )
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        discounts = result.scalars().all()

        return Page(
            meta=PageMeta(
                total=total,
                limit=limit,
                offset=offset
            ),
        data=discounts
        )
    
    # ======================== KIỂM TRA MÃ GIẢM GIÁ NGƯỜI DÙNG NHẬP CÓ ÁP DỤNG ĐƯỢC KHÔNG ==================
    async def validate_simple(self, code: str, cart_total: int):
        now = date.today()
        stmt = select(Discount).where(
            Discount.code == code.upper(),
            Discount.is_active == True
        )

        result = await self.db.execute(stmt)
        discount = result.scalar_one_or_none()

        # Không tồn tại
        if not discount:
            return {
                "valid": False,
                "final_total": cart_total,
                "message": "Mã giảm giá không tồn tại"
            }

        # Hết hạn
        if discount.start_date and now < discount.start_date or \
                discount.end_date and now > discount.end_date:
            return {
                "valid": False,
                "final_total": cart_total,
                "message": "Mã giảm giá đã hết hạn"
            }

        # Chưa đủ tiền
        if cart_total < discount.min_order_value:
            return {
                "valid": False,
                "final_total": cart_total,
                "message": f"Đơn hàng tối thiểu {discount.min_order_value}"
            }

        # Tính tiền giảm (rất đơn giản)
        percent = Decimal(discount.discount_percent)
        discount_amount = (Decimal(cart_total) * percent) / Decimal(100)

        if discount.max_discount:
            discount_amount = min(discount_amount, discount.max_discount)

        final_total = Decimal(cart_total) - discount_amount

        return {
            "valid": True,
            "discount_amount": int(discount_amount),
            "final_total": int(final_total),
            "message": "Áp dụng mã giảm giá thành công"
        }

    # ================================== GỢI Ý MÃ GIẢM GIÁ TỐT NHẤT =======================
    async def get_best_discount(self, cart_total: int):
        now = date.today()
        stmt = select(Discount).where(
            Discount.is_active == True,
            Discount.start_date <= now,
            Discount.end_date >= now,
            Discount.min_order_value <= cart_total,
            Discount.usage_limit > Discount.used_count
        )

        result = await self.db.execute(stmt)
        discounts = result.scalars().all()

        if not discounts:
            return None

        def estimate(d: Discount):
            discount_amount = (
                Decimal(cart_total)
                * Decimal(d.discount_percent)
                / Decimal(100)
            )
            if d.max_discount:
                discount_amount = min(discount_amount, d.max_discount)
            return discount_amount

        best = max(discounts, key=estimate)

        return {
            "discount_id": best.discount_id,
            "code": best.code,
            "discount_percent": float(best.discount_percent),
            "estimated_discount": int(estimate(best))
        }
    
    # =================== PREVIEW ÁP DỤNG VOUCHER (DÙNG CHO USER KÍCH VÔ VOUCHER ĐÓ) ==================
    async def preview_discount(self, discount_id: int, cart_total: int):
        now = date.today()
        stmt = select(Discount).where(
            Discount.discount_id == discount_id,
            Discount.is_active == True
        )
        result = await self.db.execute(stmt)
        discount = result.scalar_one_or_none()

        if not discount:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mã giảm giá không tồn tại"
            )

        # Hết hạn
        if discount.start_date > now or discount.end_date < now:
            return {
                "valid": False,
                "final_total": cart_total,
                "message": "Mã giảm giá không còn hiệu lực"
            }

        # Chưa đủ điều kiện đơn hàng
        if cart_total < discount.min_order_value:
            return {
                "valid": False,
                "final_total": cart_total,
                "message": f"Đơn hàng tối thiểu {int(discount.min_order_value)}"
            }

        # Hết lượt
        if discount.usage_limit <= discount.used_count:
            return {
                "valid": False,
                "final_total": cart_total,
                "message": "Mã giảm giá đã hết lượt sử dụng"
            }

        # ===== TÍNH GIẢM GIÁ =====
        percent = Decimal(discount.discount_percent)
        discount_amount = (Decimal(cart_total) * percent) / Decimal(100)

        if discount.max_discount:
            discount_amount = min(discount_amount, discount.max_discount)

        final_total = Decimal(cart_total) - discount_amount

        return {
            "valid": True,
            "discount_id": discount.discount_id,
            "code": discount.code,
            "discount_amount": int(discount_amount),
            "final_total": int(final_total),
            "message": "Có thể áp dụng mã giảm giá"
        }
   
def get_discount_service(
    db: AsyncSession = Depends(get_db)
):
    return DiscountService(db)