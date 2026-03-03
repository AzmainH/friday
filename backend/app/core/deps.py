from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import Request
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session

_DEV_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


async def get_current_user_id(request: Request) -> UUID:
    header = request.headers.get("x-user-id")
    if header:
        try:
            return UUID(header)
        except ValueError:
            pass
    return _DEV_USER_ID


async def get_redis(request: Request) -> Redis:
    return request.app.state.redis


async def get_request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)
