from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.repositories.base import BaseRepository


class WorkspaceRepository(BaseRepository[Workspace]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Workspace)

    async def get_by_slug(self, org_id: UUID, slug: str) -> Workspace | None:
        query = select(Workspace).where(
            Workspace.org_id == org_id,
            Workspace.slug == slug,
        )
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_org(self, org_id: UUID, **kwargs: Any) -> dict[str, Any]:
        return await self.get_multi(filters={"org_id": org_id}, **kwargs)
