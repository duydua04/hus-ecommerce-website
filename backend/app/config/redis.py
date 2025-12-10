import redis.asyncio as redis
from .settings import settings

redis_pool = redis.ConnectionPool.from_url(
    settings.redis_url_cache,
    encoding="utf-8",
    decode_responses=True,
    max_connections=100
)

async def get_redis_client():
    """Dependency Injection"""
    client = redis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.close()