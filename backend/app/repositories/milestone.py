from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.milestone import GateApproval, Milestone
from app.repositories.base import BaseRepository


class MilestoneRepository(BaseRepository[Milestone]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Milestone)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_upcoming(
        self, limit: int = 10
    ) -> list[Milestone]:
        from datetime import date

        query = select(Milestone).where(
            Milestone.due_date > date.today(),
        )
        query = self._apply_soft_delete_filter(query)
        query = query.order_by(Milestone.due_date.asc()).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())


class GateApprovalRepository(BaseRepository[GateApproval]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, GateApproval)

    async def get_by_milestone(
        self, milestone_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"milestone_id": milestone_id}, **kwargs
        )
