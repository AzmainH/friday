from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Project)

    async def get_by_workspace(
        self,
        workspace_id: UUID,
        *,
        include_archived: bool = False,
        **kwargs: Any,
    ) -> dict[str, Any]:
        filters: dict[str, Any] = {"workspace_id": workspace_id}
        if not include_archived:
            filters["archived_at"] = None
        return await self.get_multi(filters=filters, **kwargs)

    async def get_by_key_prefix(self, key_prefix: str) -> Project | None:
        query = select(Project).where(Project.key_prefix == key_prefix)
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
