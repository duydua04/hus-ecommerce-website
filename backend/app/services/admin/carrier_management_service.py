from __future__ import annotations
from typing import List

from fastapi import HTTPException, status, UploadFile, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from ..common.carrier_service import BaseCarrierService
from ...config.db import get_db
from ...models import Carrier, Order
from ...schemas.carrier import CarrierCreate, CarrierUpdate, CarrierOut
from ...utils.storage import storage


class AdminCarrierService(BaseCarrierService):

    def _ensure_unique_name(self, name: str, exclude_id: int = None):
        query = self.db.query(Carrier).filter(
            func.lower(Carrier.carrier_name) == func.lower(name),
            Carrier.is_active.is_(True)
        )
        if exclude_id:
            query = query.filter(Carrier.carrier_id != exclude_id)

        if query.first():
            raise HTTPException(status_code=409, detail="Carrier name exists")

    def _has_orders(self, carrier_id: int):
        return (self.db.query(Order.order_id)
                .filter(Order.carrier_id == carrier_id)
                .first() is not None
        )


    def list_carrier(self, q: str | None = None, limit: int = 10, offset: int = 0) -> List[CarrierOut]:
        """Admin xem được cả đơn vị đã ẩn"""
        query = self.db.query(Carrier)
        if q and q.strip():
            query = query.filter(Carrier.carrier_name.ilike(f"%{q.strip()}%"))

        carriers = query.order_by(Carrier.carrier_name.asc()).limit(limit).offset(offset).all()

        return [self._to_response(c) for c in carriers]


    def get_carrier(self, carrier_id: int) -> CarrierOut:
        return self._to_response(self._get_carrier_or_404(carrier_id))


    async def create_carrier(self, payload: CarrierCreate):
        name = payload.carrier_name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name required"
            )

        self._ensure_unique_name(name)

        carrier = Carrier(
            carrier_name=name,
            base_price=payload.base_price,
            price_per_kg=payload.price_per_kg,
            is_active=payload.is_active if payload.is_active is not None else True
        )
        try:
            self.db.add(carrier)
            self.db.commit()
            self.db.refresh(carrier)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Create failed"
            )

        return self._to_response(carrier)


    def update_carrier(self, carrier_id: int, payload: CarrierUpdate):
        carrier = self._get_carrier_or_404(carrier_id)

        if payload.carrier_name:
            name = payload.carrier_name.strip()
            if not name: raise HTTPException(400, "Name empty")
            if name.lower() != carrier.carrier_name.lower():
                self._ensure_unique_name(name, exclude_id=carrier_id)
                carrier.carrier_name = name

        if payload.base_price is not None:
            carrier.base_price = payload.base_price
        if payload.price_per_kg is not None:
            carrier.price_per_kg = payload.price_per_kg
        if payload.is_active is not None:
            carrier.is_active = payload.is_active

        self.db.commit()
        self.db.refresh(carrier)
        return self._to_response(carrier)


    async def upload_carrier_avatar(self, carrier_id: int, file: UploadFile) -> CarrierOut:
        carrier = self._get_carrier_or_404(carrier_id)
        res = await storage.upload_file("avatars", file, max_size_mb=2)
        carrier.carrier_avt_url = res["object_key"]
        self.db.commit()
        self.db.refresh(carrier)
        return self._to_response(carrier)


    def delete_carrier(self, carrier_id: int):
        carrier = self._get_carrier_or_404(carrier_id)

        if self._has_orders(carrier_id):
            # Xóa mềm
            carrier.is_active = False
            self.db.commit()
            return {"deleted": False, "soft_deleted": True, "id": carrier_id}

        # Xóa cứng
        self.db.delete(carrier)
        self.db.commit()

        return {"deleted": True, "id": carrier_id}


def get_admin_carrier_service(db: Session = Depends(get_db)) -> AdminCarrierService:
    return AdminCarrierService(db)