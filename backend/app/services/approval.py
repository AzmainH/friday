from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException, ValidationException
from app.models.approval import ApprovalStatus, ApprovalStep, IssueApproval
from app.repositories.approval import ApprovalStepRepository, IssueApprovalRepository


class ApprovalService:
    def __init__(self, session: AsyncSession):
        self.step_repo = ApprovalStepRepository(session)
        self.approval_repo = IssueApprovalRepository(session)
        self.session = session

    # ── Approval Steps ──────────────────────────────────────────

    async def list_steps_by_project(
        self,
        project_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.step_repo.get_by_project(
            project_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_step(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> ApprovalStep:
        data["project_id"] = project_id
        return await self.step_repo.create(data, created_by=created_by)

    async def update_step(
        self,
        step_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> ApprovalStep:
        step = await self.step_repo.get_by_id(step_id)
        if not step:
            raise NotFoundException("Approval step not found")

        updated = await self.step_repo.update(
            step_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Approval step not found")
        return updated

    async def delete_step(self, step_id: UUID) -> bool:
        deleted = await self.step_repo.hard_delete(step_id)
        if not deleted:
            raise NotFoundException("Approval step not found")
        return True

    # ── Issue Approvals ─────────────────────────────────────────

    async def request_approval(
        self, issue_id: UUID, project_id: UUID
    ) -> list[IssueApproval]:
        steps = await self.step_repo.get_active_steps(project_id)
        if not steps:
            raise ValidationException(
                "No active approval steps configured for this project"
            )

        created: list[IssueApproval] = []
        for step in steps:
            existing = await self.approval_repo.get_existing_for_issue_and_step(
                issue_id, step.id
            )
            if existing:
                created.append(existing)
                continue

            approval_data = {
                "issue_id": issue_id,
                "step_id": step.id,
                "approver_id": step.approver_id,
                "status": ApprovalStatus.PENDING,
            }
            approval = await self.approval_repo.create(approval_data)
            created.append(approval)

        return created

    async def decide_approval(
        self,
        approval_id: UUID,
        status: str,
        *,
        notes: str | None = None,
    ) -> IssueApproval:
        approval = await self.approval_repo.get_by_id(approval_id)
        if not approval:
            raise NotFoundException("Issue approval not found")

        valid_statuses = (ApprovalStatus.APPROVED.value, ApprovalStatus.REJECTED.value)
        if status not in valid_statuses:
            raise ValidationException(
                f"Invalid status: {status}. Must be one of: {', '.join(valid_statuses)}"
            )

        if approval.status != ApprovalStatus.PENDING:
            raise ConflictException("Approval has already been decided")

        update_data: dict = {
            "status": status,
            "decided_at": datetime.now(timezone.utc),
        }
        if notes is not None:
            update_data["notes"] = notes

        updated = await self.approval_repo.update(approval_id, update_data)
        if not updated:
            raise NotFoundException("Issue approval not found")
        return updated

    async def list_approvals_for_issue(
        self,
        issue_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.approval_repo.get_by_issue(
            issue_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )
