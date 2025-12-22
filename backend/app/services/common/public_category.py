import json
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio.session import AsyncSession
from fastapi import Depends
from .base_category_service import BaseCategoryService
from ...models.catalog import Category
from ...schemas.category import CategoryResponse
from ...config.db import get_db
from ...config.redis import get_redis_client
from redis.asyncio import Redis

class PublicCategoryService(BaseCategoryService):

    async def get_all_cached(self):
        """
        Lấy toàn bộ Category.
        Logic: Redis -> Miss -> DB -> Redis.
        """

        if self.redis:
            cached_data = await self.redis.get(self.CACHE_KEY_ALL)
            if cached_data:
                return json.loads(cached_data)

        stmt = select(Category).order_by(asc(Category.category_name))
        result = await self.db.execute(stmt)
        categories = result.scalars().all()

        response_data = [self._map_to_response(c).model_dump() for c in categories]

        # 3. Lưu vào Redis (Cache 1 ngày - 86400s)
        if self.redis:
            await self.redis.set(
                self.CACHE_KEY_ALL,
                json.dumps(response_data),
                ex=86400
            )

        return response_data


def get_public_category_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client)
):
    return PublicCategoryService(db, redis)