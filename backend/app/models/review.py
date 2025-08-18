from sqlalchemy import Column, Integer, String, Boolean, Numeric, Text, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..config.db import Base

class Review(Base):
    __tablename__ = "review"

    review_id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("product.product_id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyer.buyer_id"), nullable=False)
    order_id = Column(Integer, ForeignKey("order.order_id"), nullable=False)
    review_text = Column(Text)
    rating = Column(Numeric(2, 1), nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)
    review_date = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("product_id", "buyer_id", "order_id", name="ux_review_once_per_order"),
        CheckConstraint("rating >= 0 AND rating <= 5", name="ck_review_rating_range"),
    )

    product = relationship("Product")
    buyer = relationship("Buyer", back_populates="reviews")
    order = relationship("Order")
    images = relationship("ReviewImage", back_populates="review", cascade="all, delete-orphan")
    replies = relationship("ReviewReply", back_populates="review", cascade="all, delete-orphan")

class ReviewImage(Base):
    __tablename__ = "review_image"

    review_image_id = Column(Integer, primary_key=True)
    review_id = Column(Integer, ForeignKey("review.review_id"), nullable=False)
    image_url = Column(String(500), nullable=False)

    review = relationship("Review", back_populates="images")

class ReviewReply(Base):
    __tablename__ = "review_reply"

    review_reply_id = Column(Integer, primary_key=True)
    review_id = Column(Integer, ForeignKey("review.review_id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("seller.seller_id"), nullable=False)
    reply_text = Column(Text, nullable=False)
    reply_date = Column(DateTime, server_default=func.now())

    review = relationship("Review", back_populates="replies")
    seller = relationship("Seller", back_populates="replies")
