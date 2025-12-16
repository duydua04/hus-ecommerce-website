from sqlalchemy import (
    Column, Integer,Numeric, Text, DateTime, ForeignKey,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..config.db import Base
from .enums import PaymentMethodEnum, OrderStatusEnum, PaymentStatusEnum

class Order(Base):
    # Bảng đơn hàng
    __tablename__ = "order"

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_id = Column(Integer, ForeignKey("buyer.buyer_id"), nullable=False)
    buyer_address_id = Column(Integer, ForeignKey("buyer_address.buyer_address_id"), nullable=False)
    payment_method = Column(PaymentMethodEnum, nullable=False)  # bank_transfer | cod
    subtotal = Column(Numeric(10, 2), nullable=False)
    shipping_price = Column(Numeric(10, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total_price = Column(Numeric(10, 2), nullable=False)
    order_date = Column(DateTime, server_default=func.now())
    delivery_date = Column(DateTime)
    order_status = Column(OrderStatusEnum, nullable=False, default="pending")
    payment_status = Column(PaymentStatusEnum, nullable=False, default="pending")
    discount_id = Column(Integer, ForeignKey("discount.discount_id"))
    carrier_id = Column(Integer, ForeignKey("carrier.carrier_id"), nullable=False)
    notes = Column(Text)

    __table_args__ = (
        CheckConstraint(
            "subtotal >= 0 AND shipping_price >= 0 AND discount_amount >= 0 AND total_price >= 0",
            name="ck_order_price_nonneg"
        ),
        CheckConstraint(
            "total_price = subtotal + shipping_price - discount_amount",
            name="ck_order_total_logic"
        ),
    )

    buyer = relationship("Buyer", back_populates="orders")
    shipping_address = relationship("BuyerAddress", back_populates="orders")
    discount = relationship("Discount", back_populates="orders")
    carrier = relationship("Carrier", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    # Sản phẩm trong đơn hàng
    __tablename__ = "order_item"

    order_item_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("order.order_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product.product_id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id"))
    size_id = Column(Integer, ForeignKey("product_size.size_id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_order_item_qty_pos"),
        CheckConstraint("unit_price >= 0 AND total_price >= 0", name="ck_order_item_price_nonneg"),
        CheckConstraint("total_price = quantity * unit_price", name="ck_order_item_total_logic"),
    )

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    size = relationship("ProductSize")
