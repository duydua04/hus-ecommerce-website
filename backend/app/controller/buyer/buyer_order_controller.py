from fastapi import APIRouter, Body, Depends, HTTPException, Query
from typing import List
from ...schemas.address import AddressUpdate
from ...schemas.common import OrderStatus
from ...middleware.auth import require_buyer
from ...schemas.order import OrderCreate, OrderDetailResponse, OrderResponse, SellerOrderDetail, OrderCreateNew, BuyerOrderTrackingItem
from ...services.buyer.buyer_order_service import (
    BuyerOrderService, 
    get_buyer_order_service
)


router = APIRouter(
    prefix="/buyer/orders",
    tags=["buyer_order"],
    dependencies=[Depends(require_buyer)]
)

# ==== LẤY CHI TIẾT CÁC SẢN PHẨM ĐÃ CHỌN ĐỂ THANH TOÁN=====
@router.post("/selected-items", response_model=List[dict])
async def get_selected_cart_items(
    shopping_cart_item_ids: List[int] = Body(..., embed=True),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    """
    Lấy chi tiết các sản phẩm đã chọn trong giỏ hàng.

    - `shopping_cart_item_ids`: danh sách ID của các item trong giỏ hàng
    """
    if not shopping_cart_item_ids:
        raise HTTPException(status_code=400, detail="Bạn chưa chọn sản phẩm nào")

    items = await service.get_selected_cart_items(shopping_cart_item_ids)
    return items

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


# ===================== DANH SÁCH ĐƠN HÀNG CỦA BUYER THEO TRẠNG THÁI =====================
@router.get(
    "/tracking",
    response_model=List[BuyerOrderTrackingItem]
)
async def list_buyer_orders(
    tab: OrderStatus | None = Query(
        None,
        title="Trạng thái đơn hàng",
    ),
    buyer=Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service),
):
    """
    **Danh sách đơn hàng của tôi (Theo dõi đơn hàng).**

    Dùng cho màn hình "Đơn mua" với các tab trạng thái.

    ### Tham số `tab`:
    Lọc đơn hàng theo các trạng thái sau:
    - `pending`: Chờ xác nhận.
    - `processing`: Đang xử lý.
    - `shipped`: Đang giao hàng.
    - `delivered`: Giao hàng thành công.
    - `cancelled`: Đã hủy.
    - **Nếu không truyền**: Trả về toàn bộ lịch sử đơn hàng.
    """
    return await service.list_orders_tracking(
        buyer_id=buyer["user"].buyer_id,
        tab=tab
    )

# ===== DETAIL =====
@router.get("/{order_id}", response_model=OrderDetailResponse)
async def order_detail(
    order_id: int,
    buyer = Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    """
    **Xem chi tiết một đơn hàng cụ thể.**

    Trả về đầy đủ thông tin: danh sách sản phẩm, giá tiền, địa chỉ giao hàng, phương thức thanh toán và lịch sử trạng thái đơn hàng.
    """
    return await service.get_order_detail(buyer["user"].buyer_id, order_id)

# ===== UPDATE ĐỊA CHỈ GIAO HÀNG CỦA ĐƠN =====
@router.patch(
    "/{order_id}/shipping-address",
    status_code=200
)
async def update_order_shipping_address(
    order_id: int,
    payload: AddressUpdate,
    buyer = Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    """
    **Thay đổi địa chỉ giao hàng cho đơn hàng.**

    **Điều kiện:** Chỉ có thể cập nhật khi đơn hàng đang ở trạng thái `pending` (Chờ xác nhận).
    """
    return await service.update_order_shipping_address(
        buyer_id=buyer["user"].buyer_id,
        order_id=order_id,
        payload=payload
    )   

# ===================== BUYER HỦY ĐƠN =====================3
@router.patch("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    buyer=Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    """
    **Hủy đơn hàng.**

    **Điều kiện:** Buyer chỉ được phép hủy khi đơn hàng chưa chuyển sang trạng thái giao hàng.
    """
    return await service.cancel_order(buyer["user"].buyer_id, order_id)

# ===================== BUYER XÁC NHẬN ĐÃ NHẬN HÀNG =====================
@router.patch("/{order_id}/confirm")
async def confirm_received(
    order_id: int,
    buyer=Depends(require_buyer),
    service: BuyerOrderService = Depends(get_buyer_order_service)
):
    """
    **Xác nhận đã nhận hàng thành công.**

    Dùng khi người dùng đã nhận được sản phẩm và hài lòng. Trạng thái đơn hàng sẽ chuyển sang `completed`.
    """
    return await service.confirm_received(buyer["user"].buyer_id, order_id)