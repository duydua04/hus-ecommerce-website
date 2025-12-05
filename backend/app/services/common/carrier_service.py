from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from ...config.s3 import public_url
from ...models import Carrier
from ...schemas.carrier import CarrierOut


class BaseCarrierService(ABC):
    def __init__(self, db: Session):
        self.db = db

    def _get_carrier_or_404(self, carrier_id: int):
        carr = self.db.get(Carrier, carrier_id)
        if not carr:
            raise HTTPException(status_code=404, detail="Carrier not found")
        return carr

    @staticmethod
    def _to_response(c: Carrier):
        return CarrierOut(
            carrier_id=c.carrier_id,
            carrier_name=c.carrier_name,
            carrier_avt_url=public_url(c.carrier_avt_url) if c.carrier_avt_url else None,
            base_price=c.base_price,
            price_per_kg=c.price_per_kg,
            is_active=c.is_active,
        )


    @abstractmethod
    def list_carrier(self, q: str | None, limit: int, offset: int):
        pass

    @abstractmethod
    def get_carrier(self, carrier_id: int):
        pass