from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue import Issue
from app.models.sprint import Sprint, SprintStatus
from app.repositories.base import BaseRepository


class SprintRepository(BaseRepository[Sprint]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Sprint)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_active_sprint(self, project_id: UUID) -> Sprint | None:
        query = select(Sprint).where(
            Sprint.project_id == project_id,
            Sprint.status == SprintStatus.ACTIVE,
        )
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_sprint_issues(self, sprint_id: UUID) -> list[Issue]:
        query = select(Issue).where(
            Issue.sprint_id == sprint_id,
        )
        if hasattr(Issue, "is_deleted"):
            query = query.where(Issue.is_deleted == False)  # noqa: E712
        result = await self.session.execute(query)
        return list(result.scalars().all())
