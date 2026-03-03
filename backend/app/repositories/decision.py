from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.decision import Decision, DecisionIssueLink
from app.repositories.base import BaseRepository


class DecisionRepository(BaseRepository[Decision]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Decision)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_with_links(self, decision_id: UUID) -> Decision | None:
        query = (
            select(Decision)
            .options(selectinload(Decision.issue_links))
            .where(Decision.id == decision_id)
        )
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class DecisionIssueLinkRepository(BaseRepository[DecisionIssueLink]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, DecisionIssueLink)

    async def get_by_decision(
        self, decision_id: UUID
    ) -> list[DecisionIssueLink]:
        query = select(DecisionIssueLink).where(
            DecisionIssueLink.decision_id == decision_id
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def link(
        self, decision_id: UUID, issue_id: UUID
    ) -> DecisionIssueLink:
        return await self.create(
            {"decision_id": decision_id, "issue_id": issue_id}
        )

    async def unlink(self, link_id: UUID) -> bool:
        return await self.hard_delete(link_id)
