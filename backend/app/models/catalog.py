from sqlalchemy import (
    Column, Integer, String, Boolean, Numeric, Text, DateTime, Date,
    ForeignKey, UniqueConstraint, CheckConstraint
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..config.db import Base

class Category(Base):
    """
    Model danh mục sản phẩm
    """
    __tablename__ = "category"

    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(255), nullable=False, unique=True)

    products = relationship("Product", back_populates="category")

class Carrier(Base):
    """
    Model đơn vị vận chuyển
    """
    __tablename__ = "carrier"

    carrier_id = Column(Integer, primary_key=True, autoincrement=True)
    carrier_name = Column(String(255), nullable=False)
    carrier_avt_url = Column(String(255))
    base_price = Column(Numeric(10, 2), nullable=False)
    price_per_kg = Column(Numeric(10, 2), nullable=False, default=5000)
    is_active = Column(Boolean, nullable=False, default=True)

    orders = relationship("Order", back_populates="carrier")

class Product(Base):
    """
    Model sản phẩm của các seller
    """
    __tablename__ = "product"

    product_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    seller_id = Column(Integer, ForeignKey("seller.seller_id"), nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    rating = Column(Numeric(2, 1), nullable=False, default=0)
    review_count = Column(Integer, nullable=False, default=0)
    category_id = Column(Integer, ForeignKey("category.category_id"))
    description = Column(Text)
    discount_percent = Column(Numeric(4, 2), nullable=False, default=0)
    weight = Column(Numeric(10, 2))
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())

    seller = relationship("Seller", back_populates="products")
    category = relationship("Category", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    """
    Model các biến thể, phân loại của sản phẩm gốc
    VD: xanh than, chấm bi, ...
    """
    __tablename__ = "product_variant"

    variant_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("product.product_id"), nullable=False)
    variant_name = Column(String(100), nullable=False)  # color/model/style
    price_adjustment = Column(Numeric(10, 2), nullable=False, default=0)

    product = relationship("Product", back_populates="variants")
    sizes = relationship("ProductSize", back_populates="variant", cascade="all, delete-orphan")

class ProductSize(Base):
    """
    Kích cỡ sản phẩm của các variant
    """
    __tablename__ = "product_size"

    size_id = Column(Integer, primary_key=True, autoincrement=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id"), nullable=False)
    size_name = Column(String(20), nullable=False)
    available_units = Column(Integer, nullable=False, default=0)
    in_stock = Column(Boolean, nullable=False, default=True)

    variant = relationship("ProductVariant", back_populates="sizes")

class ProductImage(Base):
    """
    Danh sách ảnh của sản phẩm
    Có 1 ảnh là primary
    """
    __tablename__ = "product_image"

    product_image_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("product.product_id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, nullable=False, default=False)

    product = relationship("Product", back_populates="images")
class Discount(Base):
    """
    Mã giảm giá kiểu phần trăm, có thời gian hiệu lực và giới hạn
    """
    __tablename__ = "discount"

    discount_id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), nullable=False, unique=True)
    discount_percent = Column(Numeric(4, 2), nullable=False)
    min_order_value = Column(Numeric(10, 2), nullable=False, default=0)
    max_discount = Column(Numeric(10, 2))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    usage_limit = Column(Integer)
    used_count = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)

    orders = relationship("Order", back_populates="discount")