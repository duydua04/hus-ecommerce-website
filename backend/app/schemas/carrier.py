from __future__ import annotations
from decimal import Decimal
from pydantic import BaseModel, Field
from .common import ORMBase

# (Request)
class CarrierCreate(BaseModel):
    carrier_name: str
    carrier_avt_url: str | None = None
    base_price: Decimal = Field(..., ge=0)
    price_per_kg: Decimal = Field(5000, ge=0)
    is_active: bool | None = None
# (Request)
class CarrierUpdate(BaseModel):
    carrier_name: str | None = None
    carrier_avt_url: str | None = None
    base_price: Decimal | None = Field(None, ge=0)
    price_per_kg: Decimal | None = Field(None, ge=0)
    is_active: bool | None = None
# (Response)
class CarrierOut(ORMBase):
    carrier_id: int
    carrier_name: str
    carrier_avt_url: str | None = None
    base_price: Decimal
    price_per_kg: Decimal
    is_active: bool

class CarrierCalculateRequest(BaseModel):
    carrier_id: int
    cart_total: int
    weight: float = 0.0


class CarrierCalculateResponse(BaseModel):
    carrier_id: int
    shipping_fee: int