from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import ApprovalStep, IssueApproval
from app.repositories.base import BaseRepository


class ApprovalStepRepository(BaseRepository[ApprovalStep]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ApprovalStep)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id},
            sort_by="created_at",
            **kwargs,
        )

    async def get_active_steps(self, project_id: UUID) -> list[ApprovalStep]:
        query = (
            select(ApprovalStep)
            .where(
                ApprovalStep.project_id == project_id,
                ApprovalStep.is_active == True,  # noqa: E712
            )
            .order_by(ApprovalStep.step_order.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class IssueApprovalRepository(BaseRepository[IssueApproval]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, IssueApproval)

    async def get_by_issue(
        self, issue_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"issue_id": issue_id},
            sort_by="created_at",
            sort_order="asc",
            **kwargs,
        )

    async def get_existing_for_issue_and_step(
        self, issue_id: UUID, step_id: UUID
    ) -> IssueApproval | None:
        query = select(IssueApproval).where(
            IssueApproval.issue_id == issue_id,
            IssueApproval.step_id == step_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
