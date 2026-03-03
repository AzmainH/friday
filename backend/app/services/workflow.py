from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.issue import Issue
from app.models.workflow import Workflow, WorkflowStatus, WorkflowTransition
from app.repositories.workflow import (
    WorkflowRepository,
    WorkflowStatusRepository,
    WorkflowTransitionRepository,
)


class WorkflowService:
    def __init__(self, session: AsyncSession):
        self.repo = WorkflowRepository(session)
        self.status_repo = WorkflowStatusRepository(session)
        self.transition_repo = WorkflowTransitionRepository(session)
        self.session = session

    # ---- Workflow CRUD ----

    async def get_workflow(self, workflow_id: UUID) -> Workflow:
        workflow = await self.repo.get_by_id(workflow_id)
        if not workflow:
            raise NotFoundException("Workflow not found")
        return workflow

    async def get_workflow_detail(self, workflow_id: UUID) -> Workflow:
        workflow = await self.repo.get_with_details(workflow_id)
        if not workflow:
            raise NotFoundException("Workflow not found")
        return workflow

    async def list_by_project(
        self, project_id: UUID, **kwargs
    ) -> dict:
        return await self.repo.get_by_project(project_id, **kwargs)

    async def get_default_workflow(self, project_id: UUID) -> Workflow:
        workflow = await self.repo.get_default_for_project(project_id)
        if not workflow:
            raise NotFoundException(
                "No default workflow found for this project"
            )
        return workflow

    async def create_workflow(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> Workflow:
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def update_workflow(
        self,
        workflow_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> Workflow:
        await self.get_workflow(workflow_id)
        updated = await self.repo.update(
            workflow_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Workflow not found")
        return updated

    async def delete_workflow(self, workflow_id: UUID) -> bool:
        workflow = await self.get_workflow(workflow_id)
        if workflow.is_default:
            raise ConflictException("Cannot delete the default workflow")
        deleted = await self.repo.hard_delete(workflow_id)
        if not deleted:
            raise NotFoundException("Workflow not found")
        return True

    # ---- Status CRUD ----

    async def list_statuses(self, workflow_id: UUID) -> list[WorkflowStatus]:
        return await self.status_repo.get_by_workflow(workflow_id)

    async def create_status(
        self, workflow_id: UUID, data: dict
    ) -> WorkflowStatus:
        data["workflow_id"] = workflow_id
        return await self.status_repo.create(data)

    async def update_status(
        self, status_id: UUID, data: dict
    ) -> WorkflowStatus:
        updated = await self.status_repo.update(status_id, data)
        if not updated:
            raise NotFoundException("Workflow status not found")
        return updated

    async def delete_status(self, status_id: UUID) -> bool:
        deleted = await self.status_repo.hard_delete(status_id)
        if not deleted:
            raise NotFoundException("Workflow status not found")
        return True

    # ---- Transition CRUD ----

    async def list_transitions(
        self, workflow_id: UUID, from_status_id: UUID
    ) -> list[WorkflowTransition]:
        return await self.transition_repo.get_valid_transitions(
            workflow_id, from_status_id
        )

    async def create_transition(
        self, workflow_id: UUID, data: dict
    ) -> WorkflowTransition:
        data["workflow_id"] = workflow_id
        return await self.transition_repo.create(data)

    async def delete_transition(self, transition_id: UUID) -> bool:
        deleted = await self.transition_repo.hard_delete(transition_id)
        if not deleted:
            raise NotFoundException("Workflow transition not found")
        return True


class WorkflowEngine:
    def __init__(self, session: AsyncSession):
        self.transition_repo = WorkflowTransitionRepository(session)
        self.status_repo = WorkflowStatusRepository(session)

    async def validate_transition(
        self, issue: Issue, to_status_id: UUID
    ) -> WorkflowStatus:
        status = await self.status_repo.get_by_id(to_status_id)
        if not status:
            raise NotFoundException("Target status not found")

        valid = await self.transition_repo.get_valid_transitions(
            status.workflow_id, issue.status_id
        )
        allowed_ids = {t.to_status_id for t in valid}
        if to_status_id not in allowed_ids:
            raise ConflictException(
                f"Transition from current status to '{status.name}' is not allowed"
            )
        return status
