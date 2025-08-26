from __future__ import  annotations
from pydantic import BaseModel, Field
from .common import ORMBase, BuyerAddressLabel, SellerAddressLabel

# Gửi request tới server tạo địa chỉ mới
class AddressCreate(BaseModel):
    fullname: str
    street: str
    ward: str
    district: str
    province: str
    phone: str = Field(..., max_length = 20)

# Gửi request cập nhật địa chỉ
class AddressUpdate(BaseModel):
    fullname: str | None = None
    street: str | None = None
    ward: str | None = None
    district: str | None = None
    province: str | None = None
    phone: str | None = Field(None, max_length=20)

# Response tử server trả về thông tin địa chỉ
class AddressResponse(ORMBase):
    address_id: int
    fullname: str
    street: str
    ward: str
    district: str
    province: str
    phone: str

# Request toi server gan dia chi cho buyer
class BuyerAddressCreate(BaseModel):
    address_id: int
    is_default: bool | None = None
    label: BuyerAddressLabel | None = None

# Request thong tin dia chi cua buyer
class BuyerAddressUpdate(BaseModel):
    is_default: bool | None = None
    label: BuyerAddressLabel | None = None

#Response tra ve thong tin dia chi buyer
class BuyerAddressResponse(ORMBase):
    buyer_address_id: int
    buyer_id: int
    address_id: int
    is_default:bool
    label: BuyerAddressLabel | None = None

# Request tao dia chi seller
class SellerAddressCreate(BaseModel):
    address_id: int
    is_default: bool | None = None
    label: SellerAddressLabel | None = None

# Request cap nhat cho dia chi seller
class SellerAddressUpdate(BaseModel):
    is_default: bool | None = None
    label: SellerAddressLabel | None = None

# Response tu server tra ve
class SellerAddressResponse(ORMBase):
    seller_address_id: int
    seller_id: int
    address_id: int
    is_default: bool
    label: SellerAddressLabel | None = None