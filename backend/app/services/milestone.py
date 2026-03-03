from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.milestone import GateApprovalStatus, Milestone
from app.repositories.milestone import GateApprovalRepository, MilestoneRepository


class MilestoneService:
    def __init__(self, session: AsyncSession):
        self.repo = MilestoneRepository(session)
        self.approval_repo = GateApprovalRepository(session)
        self.session = session

    async def get_milestone(self, milestone_id: UUID) -> Milestone:
        milestone = await self.repo.get_by_id(milestone_id)
        if not milestone:
            raise NotFoundException("Milestone not found")
        return milestone

    async def list_by_project(
        self,
        project_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_project(
            project_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_milestone(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> Milestone:
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def update_milestone(
        self,
        milestone_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> Milestone:
        await self.get_milestone(milestone_id)
        updated = await self.repo.update(
            milestone_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Milestone not found")
        return updated

    async def delete_milestone(
        self, milestone_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(
            milestone_id, deleted_by=deleted_by
        )
        if not deleted:
            raise NotFoundException("Milestone not found")
        return True

    async def compute_progress(self, milestone_id: UUID) -> Milestone:
        """Compute progress as the average of linked issues (placeholder).

        In a full implementation this would query issues linked to the
        milestone and average their completion percentages.  For now it
        simply returns the milestone unchanged so the endpoint can be
        wired up without a hard dependency on issue-milestone linking.
        """
        milestone = await self.get_milestone(milestone_id)
        # Placeholder: when issue-milestone linking exists, compute the
        # average completion here and persist it.
        return milestone

    async def request_gate_approval(
        self,
        milestone_id: UUID,
        approver_id: UUID,
        *,
        notes: str | None = None,
    ):
        await self.get_milestone(milestone_id)
        data = {
            "milestone_id": milestone_id,
            "approver_id": approver_id,
            "status": GateApprovalStatus.PENDING,
            "notes": notes,
        }
        return await self.approval_repo.create(data)

    async def decide_gate(
        self,
        approval_id: UUID,
        status: str,
        *,
        notes: str | None = None,
    ):
        approval = await self.approval_repo.get_by_id(approval_id)
        if not approval:
            raise NotFoundException("Gate approval not found")
        if approval.status != GateApprovalStatus.PENDING:
            raise ConflictException("Gate approval has already been decided")

        update_data: dict = {
            "status": status,
            "decided_at": datetime.now(timezone.utc),
        }
        if notes is not None:
            update_data["notes"] = notes

        updated = await self.approval_repo.update(approval_id, update_data)
        if not updated:
            raise NotFoundException("Gate approval not found")
        return updated


class GateApprovalService:
    def __init__(self, session: AsyncSession):
        self.repo = GateApprovalRepository(session)

    async def list_by_milestone(
        self,
        milestone_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_milestone(
            milestone_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def decide(
        self,
        approval_id: UUID,
        status: str,
        *,
        notes: str | None = None,
    ):
        approval = await self.repo.get_by_id(approval_id)
        if not approval:
            raise NotFoundException("Gate approval not found")
        if approval.status != GateApprovalStatus.PENDING:
            raise ConflictException("Gate approval has already been decided")

        update_data: dict = {
            "status": status,
            "decided_at": datetime.now(timezone.utc),
        }
        if notes is not None:
            update_data["notes"] = notes

        updated = await self.repo.update(approval_id, update_data)
        if not updated:
            raise NotFoundException("Gate approval not found")
        return updated
