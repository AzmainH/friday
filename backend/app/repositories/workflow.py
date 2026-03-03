from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workflow import Workflow, WorkflowStatus, WorkflowTransition
from app.repositories.base import BaseRepository


class WorkflowRepository(BaseRepository[Workflow]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Workflow)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_default_for_project(
        self, project_id: UUID
    ) -> Workflow | None:
        query = (
            select(Workflow)
            .where(
                Workflow.project_id == project_id,
                Workflow.is_default == True,  # noqa: E712
            )
            .options(
                selectinload(Workflow.statuses),
                selectinload(Workflow.transitions),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_with_details(self, workflow_id: UUID) -> Workflow | None:
        query = (
            select(Workflow)
            .where(Workflow.id == workflow_id)
            .options(
                selectinload(Workflow.statuses),
                selectinload(Workflow.transitions),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class WorkflowStatusRepository(BaseRepository[WorkflowStatus]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, WorkflowStatus)

    async def get_by_workflow(
        self, workflow_id: UUID
    ) -> list[WorkflowStatus]:
        query = (
            select(WorkflowStatus)
            .where(WorkflowStatus.workflow_id == workflow_id)
            .order_by(WorkflowStatus.sort_order)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class WorkflowTransitionRepository(BaseRepository[WorkflowTransition]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, WorkflowTransition)

    async def get_valid_transitions(
        self, workflow_id: UUID, from_status_id: UUID
    ) -> list[WorkflowTransition]:
        query = select(WorkflowTransition).where(
            WorkflowTransition.workflow_id == workflow_id,
            WorkflowTransition.from_status_id == from_status_id,
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
