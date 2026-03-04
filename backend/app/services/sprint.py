from datetime import date
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException, ValidationException
from app.models.sprint import Sprint, SprintStatus
from app.repositories.sprint import SprintRepository


class SprintService:
    def __init__(self, session: AsyncSession):
        self.repo = SprintRepository(session)
        self.session = session

    async def get_sprint(self, sprint_id: UUID) -> Sprint:
        sprint = await self.repo.get_by_id(sprint_id)
        if not sprint:
            raise NotFoundException("Sprint not found")
        return sprint

    async def list_by_project(
        self,
        project_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        status: str | None = None,
        include_count: bool = False,
    ) -> dict:
        kwargs: dict = {
            "cursor": cursor,
            "limit": limit,
            "include_count": include_count,
        }
        if status:
            # Override filters to include status
            result = await self.repo.get_multi(
                filters={"project_id": project_id, "status": status},
                **{k: v for k, v in kwargs.items() if k != "filters"},
            )
            return result
        return await self.repo.get_by_project(project_id, **kwargs)

    async def create_sprint(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> Sprint:
        if data.get("start_date") and data.get("end_date"):
            if data["start_date"] >= data["end_date"]:
                raise ValidationException("start_date must be before end_date")
        data["project_id"] = project_id
        data.setdefault("status", SprintStatus.PLANNING)
        return await self.repo.create(data, created_by=created_by)

    async def update_sprint(
        self,
        sprint_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> Sprint:
        sprint = await self.get_sprint(sprint_id)
        if sprint.status == SprintStatus.COMPLETED:
            raise ConflictException("Cannot update a completed sprint")
        if data.get("start_date") and data.get("end_date"):
            if data["start_date"] >= data["end_date"]:
                raise ValidationException("start_date must be before end_date")
        updated = await self.repo.update(sprint_id, data, updated_by=updated_by)
        if not updated:
            raise NotFoundException("Sprint not found")
        return updated

    async def delete_sprint(
        self, sprint_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        sprint = await self.get_sprint(sprint_id)
        if sprint.status == SprintStatus.ACTIVE:
            raise ConflictException("Cannot delete an active sprint")
        deleted = await self.repo.soft_delete(sprint_id, deleted_by=deleted_by)
        if not deleted:
            raise NotFoundException("Sprint not found")
        return True

    async def start_sprint(
        self, sprint_id: UUID, *, updated_by: UUID | None = None
    ) -> Sprint:
        sprint = await self.get_sprint(sprint_id)
        if sprint.status != SprintStatus.PLANNING:
            raise ConflictException(
                f"Cannot start sprint in '{sprint.status.value}' status; must be 'planning'"
            )
        # Only one active sprint per project
        active = await self.repo.get_active_sprint(sprint.project_id)
        if active:
            raise ConflictException(
                f"Project already has an active sprint: '{active.name}'"
            )
        # Ensure sprint has at least one issue
        issues = await self.repo.get_sprint_issues(sprint_id)
        if not issues:
            raise ValidationException("Cannot start a sprint with no issues")
        updated = await self.repo.update(
            sprint_id,
            {"status": SprintStatus.ACTIVE},
            updated_by=updated_by,
        )
        if not updated:
            raise NotFoundException("Sprint not found")
        return updated

    async def complete_sprint(
        self, sprint_id: UUID, *, updated_by: UUID | None = None
    ) -> Sprint:
        sprint = await self.get_sprint(sprint_id)
        if sprint.status != SprintStatus.ACTIVE:
            raise ConflictException(
                f"Cannot complete sprint in '{sprint.status.value}' status; must be 'active'"
            )
        # Calculate velocity from completed issues' story points
        issues = await self.repo.get_sprint_issues(sprint_id)
        velocity = sum(
            i.story_points or 0
            for i in issues
            if i.percent_complete == 100
        )
        updated = await self.repo.update(
            sprint_id,
            {"status": SprintStatus.COMPLETED, "velocity": velocity},
            updated_by=updated_by,
        )
        if not updated:
            raise NotFoundException("Sprint not found")
        return updated

    async def get_sprint_burndown(self, sprint_id: UUID) -> dict:
        """Return burndown data for a sprint.

        Computes total story points and remaining points based on current
        issue completion. A full burndown chart would track daily snapshots;
        this provides the current aggregate for the frontend to render.
        """
        sprint = await self.get_sprint(sprint_id)
        issues = await self.repo.get_sprint_issues(sprint_id)
        total_points = sum(i.story_points or 0 for i in issues)
        completed_points = sum(
            i.story_points or 0
            for i in issues
            if i.percent_complete == 100
        )
        remaining_points = total_points - completed_points
        total_issues = len(issues)
        completed_issues = sum(1 for i in issues if i.percent_complete == 100)

        return {
            "sprint_id": sprint.id,
            "sprint_name": sprint.name,
            "start_date": sprint.start_date,
            "end_date": sprint.end_date,
            "total_points": total_points,
            "completed_points": completed_points,
            "remaining_points": remaining_points,
            "total_issues": total_issues,
            "completed_issues": completed_issues,
        }

    async def add_issues_to_sprint(
        self,
        sprint_id: UUID,
        issue_ids: list[UUID],
        *,
        updated_by: UUID | None = None,
    ) -> list:
        """Assign issues to the sprint by setting their sprint_id."""
        from app.models.issue import Issue
        from sqlalchemy import select

        sprint = await self.get_sprint(sprint_id)
        if sprint.status == SprintStatus.COMPLETED:
            raise ConflictException("Cannot add issues to a completed sprint")

        added = []
        for issue_id in issue_ids:
            result = await self.session.execute(
                select(Issue).where(Issue.id == issue_id)
            )
            issue = result.scalar_one_or_none()
            if not issue:
                raise NotFoundException(f"Issue {issue_id} not found")
            if issue.project_id != sprint.project_id:
                raise ValidationException(
                    f"Issue {issue_id} does not belong to the sprint's project"
                )
            issue.sprint_id = sprint_id
            if updated_by and hasattr(issue, "updated_by"):
                issue.updated_by = updated_by
            added.append(issue)
        await self.session.flush()
        for issue in added:
            await self.session.refresh(issue)
        return added

    async def remove_issue_from_sprint(
        self,
        sprint_id: UUID,
        issue_id: UUID,
        *,
        updated_by: UUID | None = None,
    ) -> None:
        """Remove an issue from the sprint by clearing its sprint_id."""
        from app.models.issue import Issue
        from sqlalchemy import select

        sprint = await self.get_sprint(sprint_id)
        if sprint.status == SprintStatus.COMPLETED:
            raise ConflictException("Cannot remove issues from a completed sprint")

        result = await self.session.execute(
            select(Issue).where(
                Issue.id == issue_id,
                Issue.sprint_id == sprint_id,
            )
        )
        issue = result.scalar_one_or_none()
        if not issue:
            raise NotFoundException(
                f"Issue {issue_id} not found in sprint {sprint_id}"
            )
        issue.sprint_id = None
        if updated_by and hasattr(issue, "updated_by"):
            issue.updated_by = updated_by
        await self.session.flush()
