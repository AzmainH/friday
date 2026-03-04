"""Redis-based caching layer for Friday."""
import json
from typing import Any

from redis.asyncio import Redis


class CacheService:
    def __init__(self, redis: Redis):
        self.redis = redis
        self.default_ttl = 300  # 5 minutes

    async def get(self, key: str) -> Any | None:
        """Get cached value, returns None if not found."""
        raw = await self.redis.get(f"cache:{key}")
        if raw is None:
            return None
        return json.loads(raw)

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Set cached value with optional TTL override."""
        await self.redis.setex(
            f"cache:{key}",
            ttl or self.default_ttl,
            json.dumps(value, default=str),
        )

    async def invalidate(self, pattern: str) -> int:
        """Invalidate all keys matching pattern. Returns count of deleted keys."""
        keys = []
        async for key in self.redis.scan_iter(f"cache:{pattern}"):
            keys.append(key)
        if keys:
            return await self.redis.delete(*keys)
        return 0

    async def invalidate_exact(self, key: str) -> bool:
        """Invalidate a single exact key."""
        return bool(await self.redis.delete(f"cache:{key}"))


def get_cache(redis: Redis) -> CacheService:
    """Factory function to create CacheService from Redis instance."""
    return CacheService(redis)
