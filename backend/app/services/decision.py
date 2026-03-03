from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.repositories.decision import (
    DecisionIssueLinkRepository,
    DecisionRepository,
)


class DecisionService:
    def __init__(self, session: AsyncSession):
        self.repo = DecisionRepository(session)
        self.link_repo = DecisionIssueLinkRepository(session)

    async def get_decision(self, decision_id: UUID):
        decision = await self.repo.get_by_id(decision_id)
        if not decision:
            raise NotFoundException("Decision not found")
        return decision

    async def list_by_project(self, project_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_project(project_id, **kwargs)

    async def create_decision(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ):
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def update_decision(
        self,
        decision_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ):
        await self.get_decision(decision_id)
        updated = await self.repo.update(
            decision_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Decision not found")
        return updated

    async def delete_decision(
        self, decision_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(decision_id, deleted_by=deleted_by)
        if not deleted:
            raise NotFoundException("Decision not found")
        return True

    async def link_issue(self, decision_id: UUID, issue_id: UUID):
        await self.get_decision(decision_id)
        existing = await self.link_repo.get_by_decision(decision_id)
        for link in existing:
            if link.issue_id == issue_id:
                raise ConflictException(
                    "Issue is already linked to this decision"
                )
        return await self.link_repo.link(decision_id, issue_id)

    async def unlink_issue(self, link_id: UUID) -> bool:
        deleted = await self.link_repo.unlink(link_id)
        if not deleted:
            raise NotFoundException("Decision-issue link not found")
        return True
