from __future__ import annotations
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...middleware.auth import require_seller
from ...models.users import Seller
from ...schemas.common import Page, OrderStatus, PaymentStatus
from ...schemas.order import SellerOrderDetail
from ...services.seller import seller_order_service as svc

router = APIRouter(
    prefix="/seller/orders",
    tags=["seller-orders"],
    dependencies=[Depends(require_seller)]
)

def current_seller(auth = Depends(require_seller)):
    return auth["user"]

@router.get("", response_model=Page)
def list_orders(
    order_status: Optional[OrderStatus] = Query(None),
    payment_status: Optional[PaymentStatus] = Query(None),
    date_from: Optional[str] = Query(None, description="ISO datetime, vd: 2025-10-01T00:00:00"),
    date_to: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Tìm theo order_id (exact) hoặc tên buyer"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    seller: Seller = Depends(current_seller),
):
    """Router list ra danh sach order cho seller"""
    df = datetime.fromisoformat(date_from) if date_from else None
    dt = datetime.fromisoformat(date_to) if date_to else None
    return svc.list_orders_for_seller(
        db=db,
        seller_id=seller.seller_id,
        order_status=order_status,
        payment_status=payment_status,
        date_from=df,
        date_to=dt,
        q=q,
        limit=limit,
        offset=offset,
    )

@router.get("/{order_id}", response_model=SellerOrderDetail)
def get_order_detail(
    order_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    seller: Seller = Depends(current_seller),
):
    """Router xem chi tiet don dat hang o phia seller"""
    return svc.get_order_detail_for_seller(db, seller.seller_id, order_id)

@router.post("/{order_id}/confirm", status_code=status.HTTP_204_NO_CONTENT)
def confirm_order(
    order_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    seller: Seller = Depends(current_seller),
):
    """Router danh dau xac nhan don hang khi co don hang duoc tao"""
    svc.confirm_order(db, seller.seller_id, order_id)
    return None

@router.post("/{order_id}/ship", status_code=status.HTTP_204_NO_CONTENT)
def mark_shipped(
    order_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    seller: Seller = Depends(current_seller),
):
    """Router danh dau da giao cho don vi van chuyen"""
    svc.mark_shipped(db, seller.seller_id, order_id)
    return None

