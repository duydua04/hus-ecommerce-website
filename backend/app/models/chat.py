from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..config.db import Base


class Conversation(Base):
    __tablename__ = "conversation"

    conversation_id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyer.buyer_id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("seller.seller_id"), nullable=False)
    last_message = Column(Text, nullable=True)
    last_message_at = Column(DateTime, default=datetime.now(timezone.utc), index=True)
    unread_counts = Column(JSON, default={"buyer": 0, "seller": 0})

    # Quan hệ
    buyer = relationship("Buyer", backref="conversation")
    seller = relationship("Seller", backref="conversation")
    messages = relationship("Message", back_populates="conversation")

    # 1 Buyer chỉ có 1 Chat với 1 Seller
    __table_args__ = (
        UniqueConstraint('buyer_id', 'seller_id', name='unique_chat_pair'),
    )


class Message(Base):
    __tablename__ = "message"

    message_id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversation.conversation_id"), nullable=False)
    sender = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    images = Column(JSON, default=[])
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc), index=True)

    conversation = relationship("Conversation", back_populates="messages")