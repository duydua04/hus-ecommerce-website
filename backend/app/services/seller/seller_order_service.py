from __future__ import annotations
from datetime import datetime
from typing import Optional, List

from fastapi import HTTPException, status
from sqlalchemy import func, or_, cast
from sqlalchemy.sql.sqltypes import String
from sqlalchemy.orm import Session

from ...config import public_url
from ...models import Carrier
from ...models.order import Order, OrderItem
from ...models.catalog import Product
from ...models.users import Buyer
from ...models.address import BuyerAddress, Address

from ...schemas.common import Page, PageMeta, OrderStatus, PaymentStatus, PaymentMethod
from ...schemas.order import OrderResponse, OrderItemResponse, SellerOrderDetail
from ...schemas.address import AddressResponse

# ----------------------- Helpers / Guards -----------------------

def _404():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

def _bad(msg: str):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

def _page(total: int, limit: int, offset: int, data: list) -> Page:
    return Page(meta=PageMeta(total=total, limit=limit, offset=offset), data=data)

def ensure_order_belongs_to_seller(db: Session, seller_id: int, order_id: int):
    """
    Chỉ cho phép Seller thao tác lên Order có ÍT NHẤT 1 item thuộc sản phẩm của họ.
    Anti-IDOR: nếu không thỏa, trả 404.
    """
    exists_q = (
        db.query(Order.order_id)
        .join(OrderItem, OrderItem.order_id == Order.order_id)
        .join(Product, Product.product_id == OrderItem.product_id)
        .filter(Order.order_id == order_id, Product.seller_id == seller_id)
        .distinct()
    )
    if not db.query(exists_q.exists()).scalar():
        _404()


# ----------------------- List orders -----------------------

def list_orders_for_seller(
    db: Session,
    seller_id: int,
    order_status: Optional[OrderStatus] = None,
    payment_status: Optional[PaymentStatus] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    q: Optional[str] = None,   # order_id (exact) hoặc tên buyer (ilike)
    limit: int = 20,
    offset: int = 0,
):
    """
    Trả Page[OrderResponse] — gồm các Order có item thuộc Seller.
    """
    # Subquery: tập order_id thuộc seller
    base_sub = (
        db.query(Order.order_id)
        .join(OrderItem, OrderItem.order_id == Order.order_id)
        .join(Product, Product.product_id == OrderItem.product_id)
        .filter(Product.seller_id == seller_id)
        .distinct()
        .subquery()
    )

    # Tao truy van kem theo cac dieu kien loc duoc truyen vao
    qset = db.query(Order).join(base_sub, base_sub.c.order_id == Order.order_id)

    if order_status is not None:
        qset = qset.filter(Order.order_status == order_status)
    if payment_status is not None:
        qset = qset.filter(Order.payment_status == payment_status)
    if date_from:
        qset = qset.filter(Order.order_date >= date_from)
    if date_to:
        qset = qset.filter(Order.order_date < date_to)

    if q:
        # Noi voi buyer de tim theo ten, dung subquery
        buyer_sub = (
            db.query(
                Order.order_id.label("oid"),
                func.concat(Buyer.fname, " ", func.coalesce(Buyer.lname, "")).label("buyer_name"),
            )
            .join(OrderItem, OrderItem.order_id == Order.order_id)
            .join(Product, Product.product_id == OrderItem.product_id)
            .join(Buyer, Buyer.buyer_id == Order.buyer_id)
            .filter(Product.seller_id == seller_id)
            .distinct()
            .subquery()
        )

        key = q.strip()
        qset = (
            qset.outerjoin(buyer_sub, buyer_sub.c.oid == Order.order_id)
                .filter(
                    or_(
                        cast(Order.order_id, String) == key,
                        buyer_sub.c.buyer_name.ilike(f"%{key}%"),
                    )
                )
        )

    total = qset.count()
    rows = qset.order_by(Order.order_date.desc()).limit(limit).offset(offset).all()

    data = [OrderResponse.model_validate(o) for o in rows]
    return _page(total, limit, offset, data)


# ----------------------- Order detail -----------------------

def get_order_detail_for_seller(db: Session, seller_id: int, order_id: int):
    ensure_order_belongs_to_seller(db, seller_id, order_id)

    o: Order | None = db.query(Order).filter(Order.order_id == order_id).first()
    if not o:
        _404()

    # Buyer: tên đầy đủ + phone
    buyer = db.query(Buyer).filter(Buyer.buyer_id == o.buyer_id).first()
    buyer_name = f"{buyer.fname} {buyer.lname or ''}".strip() if buyer else None
    buyer_phone = buyer.phone if buyer else None

    # Địa chỉ giao: order.buyer_address_id -> buyer_address -> address
    addr_resp = None
    if o.buyer_address_id:
        baddr = db.query(BuyerAddress).filter(BuyerAddress.buyer_address_id == o.buyer_address_id).first()
        if baddr:
            addr = db.query(Address).filter(Address.address_id == baddr.address_id).first()
            if addr:
                addr_resp = AddressResponse.model_validate(addr)

    # Items của seller
    item_rows = (
        db.query(OrderItem, Product)
        .join(Product, Product.product_id == OrderItem.product_id)
        .filter(OrderItem.order_id == order_id, Product.seller_id == seller_id)
        .all()
    )

    carr = (db.query(Carrier.carrier_name, Carrier.carrier_avt_url)
            .join(Order, Carrier.carrier_id == Order.carrier_id)
            .filter(Order.order_id == order_id)
            .first()
    )

    item_resps: List[OrderItemResponse] = [OrderItemResponse.model_validate(it) for it, _ in item_rows]

    return SellerOrderDetail(
        order=OrderResponse.model_validate(o),
        shipping_address=addr_resp,
        items=item_resps,
        buyer_name=buyer_name,
        buyer_phone=buyer_phone,
        carrier_name=carr.carrier_name,
        carrier_avt_url=public_url(carr.carrier_avt_url)
    )

def _require_status(current: OrderStatus, allowed: List[OrderStatus]):
    if current not in allowed:
        _bad(f"Invalid state transition from '{current.value}'")

def confirm_order(db: Session, seller_id: int, order_id: int):
    """
    Xác nhận đơn hàng:
    - Chuyển trạng thái đơn từ pending -> processing
    - Nếu phương thức thanh toán là bank_transfer thì auto set payment_status = paid
    """
    ensure_order_belongs_to_seller(db, seller_id, order_id)
    o = db.query(Order).filter(Order.order_id == order_id).with_for_update().first()
    if not o:
        _404()

    _require_status(o.order_status, [OrderStatus.pending])

    # Auto chuyen sang da thanh toan khi khach hang lua chon phuong thuc thanh toan la chuyen khoan
    if o.payment_method == PaymentMethod.bank_transfer:
        if o.payment_status == PaymentStatus.pending:
            o.payment_status = PaymentStatus.paid

    # Chuyển trạng thái đơn
    o.order_status = OrderStatus.processing
    db.add(o)
    db.commit()

def mark_shipped(db: Session, seller_id: int, order_id: int):
    """Service seller danh dau da giao cho don vi van chuyen"""
    ensure_order_belongs_to_seller(db, seller_id, order_id)
    o = db.query(Order).filter(Order.order_id == order_id).with_for_update().first()
    if not o:
        _404()

    _require_status(o.order_status, [OrderStatus.processing])

    o.order_status = OrderStatus.shipped
    db.add(o)
    db.commit()
