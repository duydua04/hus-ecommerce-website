from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field

# Class request gửi lên server đăng ký người mua
class RegisterBuyer(BaseModel):
    email: EmailStr
    phone: str = Field(..., max_length=15)
    fname: str
    lname: str
    password: str = Field(..., min_length=6)

# Class request gui len server dang ky nguoi ban
class RegisterSeller(BaseModel):
    email: EmailStr
    phone: str = Field(..., max_length=15)
    fname: str
    lname: str
    password: str = Field(..., min_length=6)
    shopname: str

class Login(BaseModel):
    email: EmailStr
    password: str

class Token:
    access_token: str
    token_type: str