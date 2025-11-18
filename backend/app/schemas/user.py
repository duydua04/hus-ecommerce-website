from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from .common import ORMBase, TimestampedOut, BuyerTier, SellerTier

# Respone từ server trả về thông tin admin
class AdminResponse(TimestampedOut):
    admin_id: int
    email: EmailStr
    phone: str
    fname: str
    lname: str | None = None
    avt_url: str | None = None

# Request tới server tạo Buyer
class BuyerCreate(BaseModel):
    email: EmailStr
    phone: str = Field(..., max_length=15)
    fname: str
    lname: str | None = None
    password: str = Field(..., min_length=6)
    avt_url: str | None = None
    buyer_tier: BuyerTier | None = None

# Request toi server thong tin update cua Buyer
class BuyerUpdate(BaseModel):
    phone: str | None = Field(None, max_length=15)
    fname: str | None = None
    lname: str | None = None
    avt_url: str | None = None
    buyer_tier: BuyerTier | None = None
    is_active: bool | None = None

# Response tra ve thong tin cua buyer
class BuyerResponse(TimestampedOut):
    buyer_id: int
    email: EmailStr
    phone: str
    fname: str
    lname: str | None = None
    avt_url: str | None = None
    buyer_tier: BuyerTier
    is_active: bool

# Request toi server tao nguoi ban
class SellerCreate(BaseModel):
    email: EmailStr
    phone: str = Field(..., max_length=15)
    fname: str
    lname: str | None = None
    password: str = Field(..., min_length=6)
    shop_name: str
    seller_tier: SellerTier | None = None
    avt_url: str | None = None

# Request toi server update thong tin nguoi ban
class SellerUpdate(BaseModel):
    phone: str | None = Field(None, max_length=15)
    fname: str | None = None
    lname: str | None = None
    shop_name: str | None = None
    #seller_tier: SellerTier | None = None
    #avt_url: str | None = None
    #is_active: bool | None = None

# Response tu server tra ve thong tin cua nguoi ban
class SellerResponse(TimestampedOut):
    seller_id: int
    email: EmailStr
    phone: str
    fname: str
    lname: str | None = None
    shop_name: str
    seller_tier: SellerTier
    avt_url: str | None = None
    average_rating: float
    rating_count: int
    is_active: bool