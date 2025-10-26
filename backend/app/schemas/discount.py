from __future__ import annotations
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field
from .common import ORMBase

# Request tao discount tu model
class DiscountCreate(BaseModel):
    code: str
    discount_percent: Decimal = Field(..., ge=0, le=100)
    min_order_value: Decimal | None = Field(0, ge=0)
    max_discount: Decimal | None = Field(None, ge=0)
    start_date: date
    end_date: date
    usage_limit: int | None = None
    is_active: bool | None = None

# Request update thong tin discount
class DiscountUpdate(BaseModel):
    discount_percent: Decimal | None = Field(None, ge=0, le=100)
    min_order_value: Decimal | None = Field(None, ge=0)
    max_discount: Decimal | None = Field(None, ge=0)
    start_date: date | None = None
    end_date: date | None = None
    usage_limit: int | None = None
    is_active: bool | None = None

# Response tra ve discount
class DiscountResponse(ORMBase):
    discount_id: int
    code: str
    discount_percent: Decimal
    min_order_value: Decimal
    max_discount: Decimal | None = None
    start_date: date
    end_date: date
    usage_limit: int | None = None
    used_count: int
    is_active: bool
