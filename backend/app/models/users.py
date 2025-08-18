from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..config.db import Base
from .enums import BuyerTierEnum, SellerTierEnum

# Model admin hệ thống
class Admin(Base):
    __tablename__ = "admin"

    admin_id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(20), nullable=False, unique=True)
    fname = Column(String(255), nullable=False)
    lname = Column(String(255))
    password = Column(String(255), nullable=False)
    avt_url = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

#Model khách hàng/người mua
class Buyer(Base):
    __tablename__ = "buyer"

    buyer_id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(20), nullable=False, unique=True)
    fname = Column(String(255), nullable=False)
    lname = Column(String(255))
    password = Column(String(255), nullable=False)
    avt_url = Column(String(255))
    buyer_tier = Column(BuyerTierEnum, nullable=False, default="bronze")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())

    addresses = relationship("BuyerAddress", back_populates="buyer", cascade="all, delete-orphan")
    cart = relationship("ShoppingCart", back_populates="buyer", uselist=False, cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="buyer")
    reviews = relationship("Review", back_populates="buyer")

# Model người bán
class Seller(Base):
    __tablename__ = "seller"

    seller_id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(20), nullable=False, unique=True)
    fname = Column(String(255), nullable=False)
    lname = Column(String(255))
    password = Column(String(255), nullable=False)
    shop_name = Column(String(255), nullable=False)
    seller_tier = Column(SellerTierEnum, nullable=False, default="regular")
    avt_url = Column(String(255))
    description = Column(String(255))
    average_rating = Column(Numeric(2, 1), nullable=False, default=0)
    rating_count = Column(Integer, nullable=False, default=0)
    is_verified = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())

    addresses = relationship("SellerAddress", back_populates="seller", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="seller", cascade="all, delete-orphan")
    replies = relationship("ReviewReply", back_populates="seller")

