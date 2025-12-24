import redis.asyncio as redis
from fastapi import HTTPException, status
from ...config.redis import redis_pool
from ...utils.lua_scripts import get_decr_stock_script


class InventoryService:
    def __init__(self):
        self.redis = redis.Redis(connection_pool=redis_pool)
        self.decr_script = self.redis.register_script(get_decr_stock_script())


    async def reserve_stock(self, size_id: int, quantity: int):
        """
        Trừ kho trên Redis.
        """
        key = f"stock_size:{size_id}"

        result = await self.decr_script(keys=[key], args=[quantity])

        if result == -1:
            print(f"[CACHE MISS] Key {key} not found in Redis")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Dữ liệu kho chưa được đồng bộ, vui lòng thử lại sau"
            )

        if result == -2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sản phẩm đã hết hàng hoặc không đủ số lượng"
            )

        return True


    async def restore_stock(self, size_id: int, quantity: int):
        """
        Hoàn lại tồn kho trên Redis
        """
        key = f"stock_size:{size_id}"
        try:
            await self.redis.incrby(key, quantity)
        except Exception as e:
            print(f"[REDIS ERROR] Failed to restore stock for {key}: {e}")
            raise e


    async def init_stock(self, size_id: int, quantity: int):
        key = f"stock_size:{size_id}"
        await self.redis.set(key, quantity)


inventory_service = InventoryService()