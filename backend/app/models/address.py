from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..config.db import Base
from .enums import BuyerAddrLabelEnum, SellerAddrLabelEnum

class Address(Base):
    """
    Địa chỉ dùng chung, liên kết tới buyer/seller qua bảng nối
    """
    __tablename__ = "address"

    address_id = Column(Integer, primary_key=True)
    fullname = Column(String(255), nullable=False)
    street = Column(String(255), nullable=False)
    city = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False)
    country = Column(String(50), nullable=False)

    buyer_links = relationship("BuyerAddress", back_populates="address")
    seller_links = relationship("SellerAddress", back_populates="address")

class BuyerAddress(Base):
    """
    Địa chỉ giao hàng của ngừoi mua
    """
    __tablename__ = "buyer_address"

    buyer_address_id = Column(Integer, primary_key=True)
    buyer_id = Column(Integer, ForeignKey("buyer.buyer_id"), nullable=False)
    address_id = Column(Integer, ForeignKey("address.address_id"), nullable=False)
    phone = Column(String(20), nullable=False)
    is_default = Column(Boolean, nullable=False, default=False)
    label = Column(BuyerAddrLabelEnum)  # nullable theo DDL

    buyer = relationship("Buyer", back_populates="addresses")
    address = relationship("Address", back_populates="buyer_links")
    orders = relationship("Order", back_populates="shipping_address")

class SellerAddress(Base):
    """
    Địa chỉ lấy hàng của người bán
    """
    __tablename__ = "seller_address"

    seller_address_id = Column(Integer, primary_key=True)
    seller_id = Column(Integer, ForeignKey("seller.seller_id"), nullable=False)
    address_id = Column(Integer, ForeignKey("address.address_id"), nullable=False)
    phone = Column(String(20), nullable=False)
    is_default = Column(Boolean, nullable=False, default=False)
    label = Column(SellerAddrLabelEnum)  # nullable theo DDL

    seller = relationship("Seller", back_populates="addresses")
    address = relationship("Address", back_populates="seller_links")
