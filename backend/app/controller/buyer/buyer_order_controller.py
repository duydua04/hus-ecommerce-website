from fastapi import APIRouter, Depends
from ...middleware.auth import require_buyer
from ...schemas.order import OrderCreate, OrderResponse, SellerOrderDetail, OrderCreateNew
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
@router.post(
    "",
    response_model=OrderResponse  # trả về order vừa tạo
)
async def create_order(
    payload: OrderCreateNew,
    buyer=Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    """
    Tạo đơn hàng từ các sản phẩm được chọn trong giỏ hàng.

    - User chỉ cần chọn sản phẩm muốn mua (cart_item_ids)
    - Backend tự tính subtotal, shipping, discount, total_price
    - Xóa các sản phẩm đã mua khỏi giỏ hàng
    """
    return await service.place_order(
        buyer_id=buyer["user"].buyer_id,
        payload=payload
    )

# ===== LIST =====
@router.get("", response_model=list[OrderResponse])
async def list_my_orders(
    buyer = Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service),
):
    return await service.list_my_orders(buyer["user"].buyer_id)

# ===== DETAIL =====
@router.get("/{order_id}", response_model=SellerOrderDetail)
async def order_detail(
    order_id: int,
    buyer = Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    return await service.get_order_detail(buyer["user"].buyer_id, order_id)
