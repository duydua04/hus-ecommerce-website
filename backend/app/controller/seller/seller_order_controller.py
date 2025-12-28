from fastapi import APIRouter, Depends, status
from ...middleware.auth import require_seller

from ...services.seller.seller_order_service import get_seller_order_service, SellerOrderService

from ...schemas.seller_order import (
    SellerOrderFilter,
    SellerOrderDetailResponse,
    SellerCancelReason
)
from ...schemas.common import Page

router = APIRouter(
    prefix="/seller/orders",
    tags=["seller-orders"]
)


@router.get(
    "/",
    response_model=Page,
    status_code=status.HTTP_200_OK
)
async def list_orders(
        filters: SellerOrderFilter = Depends(),
        seller_info: dict = Depends(require_seller),
        service: SellerOrderService = Depends(get_seller_order_service)
):
    """
    API lấy danh sách đơn hàng.
    """
    seller_id = seller_info["user"].seller_id

    return await service.list_orders(seller_id, filters)


@router.get(
    "/{order_id}",
    response_model=SellerOrderDetailResponse,
    status_code=status.HTTP_200_OK
)
async def get_order_detail(
        order_id: int,
        seller_info: dict = Depends(require_seller),
        service: SellerOrderService = Depends(get_seller_order_service)
):
    """
    Xem chi tiết đơn hàng (Sản phẩm, địa chỉ, người mua...).
    Chỉ xem được đơn thuộc về Shop này.
    """
    seller_id = seller_info["user"].seller_id
    return await service.get_order_detail(seller_id, order_id)


@router.put(
    "/{order_id}/confirm",
    summary="Xác nhận đơn hàng (Pending -> Processing)",
    status_code=status.HTTP_200_OK
)
async def confirm_order(
        order_id: int,
        seller_info: dict = Depends(require_seller),
        service: SellerOrderService = Depends(get_seller_order_service)
):
    """
    Shop xác nhận đơn hàng để chuẩn bị gói hàng.
    Hệ thống sẽ gửi thông báo cho Buyer.
    """
    seller_id = seller_info["user"].seller_id
    return await service.confirm_order(seller_id, order_id)


@router.put(
    "/{order_id}/ship",
    summary="Xác nhận giao hàng (Processing -> Shipped)",
    status_code=status.HTTP_200_OK
)
async def ship_order(
        order_id: int,
        seller_info: dict = Depends(require_seller),
        service: SellerOrderService = Depends(get_seller_order_service)
):
    """
    Chuyển trạng thái sang Đã Giao (Shipped) khi bàn giao cho ĐVVC.
    """
    seller_id = seller_info["user"].seller_id
    return await service.mark_as_shipped(seller_id, order_id)


@router.put(
    "/{order_id}/cancel",
    summary="Hủy đơn hàng & Hoàn kho",
    status_code=status.HTTP_200_OK
)
async def cancel_order(
        order_id: int,
        payload: SellerCancelReason,
        seller_info: dict = Depends(require_seller),
        service: SellerOrderService = Depends(get_seller_order_service)
):
    """
    Shop hủy đơn hàng (chỉ hủy được khi chưa giao).
    Hệ thống sẽ tự động hoàn lại số lượng tồn kho (Redis + DB).
    """
    seller_id = seller_info["user"].seller_id
    return await service.cancel_order(seller_id, order_id, payload.reason)