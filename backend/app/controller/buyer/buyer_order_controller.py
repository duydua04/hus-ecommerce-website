from fastapi import APIRouter, Depends
from ...middleware.auth import require_buyer
from ...schemas.order import OrderCreate, OrderResponse, SellerOrderDetail
from ...services.buyer.buyer_order_service import (
    BuyerOrderService,
    get_buyer_order_service
)

router = APIRouter(
    prefix="/buyer/orders",
    tags=["buyer_order"],
    dependencies=[Depends(require_buyer)]
)

# ===== TẠO ĐƠN =====
@router.post("", response_model=OrderResponse, status_code=201)
async def place_order(
    payload: OrderCreate,
    buyer = Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    return await service.place_order(buyer.buyer_id, payload)

# ===== LIST =====
@router.get("", response_model=list[OrderResponse])
async def list_my_orders(
    auth = Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service),
):
    buyer = auth["user"]
    return await service.list_my_orders(buyer.buyer_id)

# ===== DETAIL =====
@router.get("/{order_id}", response_model=SellerOrderDetail)
async def order_detail(
    order_id: int,
    buyer = Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    return await service.get_order_detail(buyer.buyer_id, order_id)
