from sqlalchemy import (
    Column, Integer, Boolean, DateTime, ForeignKey,
    UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..config.db import Base

class ShoppingCart(Base):
    """
    Bảng giỏ hàng, mỗi buyer có tối đa 1 giỏ hàng
    """
    __tablename__ = "shopping_cart"

    shopping_cart_id = Column(Integer, primary_key=True)
    buyer_id = Column(Integer, ForeignKey("buyer.buyer_id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime)

    __table_args__ = (
        UniqueConstraint("buyer_id", name="ux_cart_buyer"),
    )

    buyer = relationship("Buyer", back_populates="cart")
    items = relationship("ShoppingCartItem", back_populates="cart", cascade="all, delete-orphan")

class ShoppingCartItem(Base):
    """
    Các đơn hàng trong giỏ hàng
    """
    __tablename__ = "shopping_cart_item"

    shopping_cart_item_id = Column(Integer, primary_key=True)
    shopping_cart_id = Column(Integer, ForeignKey("shopping_cart.shopping_cart_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product.product_id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id"))
    size_id = Column(Integer, ForeignKey("product_size.size_id"))
    quantity = Column(Integer, nullable=False, default=1)
    added_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("shopping_cart_id", "product_id", "variant_id", "size_id", name="ux_cart_item_unique"),
        CheckConstraint("quantity > 0", name="ck_cart_item_qty_pos"),
    )

    cart = relationship("ShoppingCart", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    size = relationship("ProductSize")
