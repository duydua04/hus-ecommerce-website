import asyncio
from ..services.admin.admin_dashboard_service import admin_dashboard_service
#from ..services.seller.seller_dashboard_service import seller_dashboard_service
from ..utils.celery_client import celery_app
from ..utils.socket_manager import socket_manager

def run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)

# ============================================================
# GROUP 1: ADMIN TASKS (TÍNH TOÁN)
# ============================================================
@celery_app.task(name="task_admin_sync_order")
def task_admin_sync_order(order_data: dict):
    async def _process():
        # Cộng dồn Counters, Rankings (Buyer/Seller)
        await admin_dashboard_service.handle_new_order_stats(order_data)
        await socket_manager.broadcast_admin("DATA_UPDATED")
    run_async(_process())

@celery_app.task(name="task_admin_revert_order")
def task_admin_revert_order(order_data: dict):
    async def _process():
        # Trừ ngược lại khi hủy
        await admin_dashboard_service.handle_revert_order_stats(order_data)
        await socket_manager.broadcast_admin("DATA_UPDATED")
    run_async(_process())

@celery_app.task(name="task_admin_sync_user")
def task_admin_sync_user(role: str, action: str):
    """role: 'buyer'/'seller', action: 'add'/'delete'"""
    async def _process():
        await admin_dashboard_service.handle_user_event(role, action)
        await socket_manager.broadcast_admin("DATA_UPDATED")
    run_async(_process())

# ============================================================
# GROUP 2: SELLER TASKS (XÓA CACHE)
# ============================================================
# @celery_app.task(name="task_seller_sync_order")
# def task_seller_sync_order(seller_id: int, created_at: str):
#     async def _process():
#         await seller_dashboard_service.handle_realtime_update(seller_id, created_at)
#     run_async(_process())
#
# @celery_app.task(name="task_seller_revert_order")
# def task_seller_revert_order(seller_id: int, created_at: str):
#     async def _process():
#         await seller_dashboard_service.handle_realtime_update(seller_id, created_at)
#     run_async(_process())