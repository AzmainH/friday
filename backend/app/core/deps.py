from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import Request
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.organization import Organization
from app.models.workspace import Workspace

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


async def resolve_workspace_id(
    workspace_id: str,
    session: AsyncSession,
) -> UUID | None:
    """Resolve workspace_id string to UUID. 'default' -> first workspace with slug default."""
    if not workspace_id:
        return None
    try:
        return UUID(workspace_id)
    except ValueError:
        pass
    if workspace_id.lower() == "default":
        org_result = await session.execute(
            select(Organization).where(Organization.slug == "default")
        )
        org = org_result.scalar_one_or_none()
        if org:
            ws_result = await session.execute(
                select(Workspace).where(
                    Workspace.org_id == org.id,
                    Workspace.slug == "default",
                    Workspace.is_deleted == False,  # noqa: E712
                )
            )
            ws = ws_result.scalar_one_or_none()
            if ws:
                return ws.id
    return None
