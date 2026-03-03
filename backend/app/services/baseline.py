from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.models.baseline import Baseline
from app.models.issue import Issue
from app.repositories.baseline import BaselineRepository, BaselineSnapshotRepository


class BaselineService:
    def __init__(self, session: AsyncSession):
        self.repo = BaselineRepository(session)
        self.snapshot_repo = BaselineSnapshotRepository(session)
        self.session = session

    async def create_baseline(
        self,
        project_id: UUID,
        data: dict,
        user_id: UUID | None = None,
    ) -> Baseline:
        data["project_id"] = project_id
        baseline = await self.repo.create(data, created_by=user_id)

        # Snapshot all issues in the project
        query = select(Issue).where(Issue.project_id == project_id)
        if hasattr(Issue, "is_deleted"):
            query = query.where(Issue.is_deleted == False)  # noqa: E712
        result = await self.session.execute(query)
        issues = list(result.scalars().all())

        if issues:
            snapshot_dicts = [
                {
                    "baseline_id": baseline.id,
                    "issue_id": issue.id,
                    "planned_start": issue.planned_start,
                    "planned_end": issue.planned_end,
                    "estimated_hours": issue.estimated_hours,
                    "story_points": issue.story_points,
                    "status_id": issue.status_id,
                }
                for issue in issues
            ]
            await self.snapshot_repo.bulk_create(snapshot_dicts)

        # Reload with snapshots
        baseline_with_snapshots = await self.repo.get_with_snapshots(baseline.id)
        return baseline_with_snapshots or baseline

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

    async def get_baseline(self, baseline_id: UUID) -> Baseline:
        baseline = await self.repo.get_with_snapshots(baseline_id)
        if not baseline:
            raise NotFoundException("Baseline not found")
        return baseline

    async def delete_baseline(
        self, baseline_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        baseline = await self.repo.get_by_id(baseline_id)
        if not baseline:
            raise NotFoundException("Baseline not found")
        deleted = await self.repo.hard_delete(baseline_id)
        if not deleted:
            raise NotFoundException("Baseline not found")
        return True

    async def compare(self, baseline_id: UUID) -> dict:
        baseline = await self.repo.get_with_snapshots(baseline_id)
        if not baseline:
            raise NotFoundException("Baseline not found")

        snapshots = baseline.snapshots
        if not snapshots:
            return {
                "baseline_id": baseline.id,
                "baseline_name": baseline.name,
                "variances": [],
            }

        # Fetch current issue data for all snapshotted issues
        issue_ids = [s.issue_id for s in snapshots]
        query = select(Issue).where(Issue.id.in_(issue_ids))
        result = await self.session.execute(query)
        issues_by_id = {issue.id: issue for issue in result.scalars().all()}

        variances = []
        for snapshot in snapshots:
            issue = issues_by_id.get(snapshot.issue_id)

            current_planned_start = issue.planned_start if issue else None
            current_planned_end = issue.planned_end if issue else None
            current_estimated_hours = issue.estimated_hours if issue else None
            current_story_points = issue.story_points if issue else None
            current_status_id = issue.status_id if issue else None

            # Compute date diffs (in days)
            start_date_diff = None
            if snapshot.planned_start and current_planned_start:
                start_date_diff = (current_planned_start - snapshot.planned_start).days

            end_date_diff = None
            if snapshot.planned_end and current_planned_end:
                end_date_diff = (current_planned_end - snapshot.planned_end).days

            # Compute hours diff
            hours_diff = None
            if snapshot.estimated_hours is not None and current_estimated_hours is not None:
                hours_diff = current_estimated_hours - snapshot.estimated_hours

            # Compute story points diff
            sp_diff = None
            if snapshot.story_points is not None and current_story_points is not None:
                sp_diff = current_story_points - snapshot.story_points

            variances.append(
                {
                    "issue_id": snapshot.issue_id,
                    "baseline_planned_start": snapshot.planned_start,
                    "baseline_planned_end": snapshot.planned_end,
                    "baseline_estimated_hours": snapshot.estimated_hours,
                    "baseline_story_points": snapshot.story_points,
                    "baseline_status_id": snapshot.status_id,
                    "current_planned_start": current_planned_start,
                    "current_planned_end": current_planned_end,
                    "current_estimated_hours": current_estimated_hours,
                    "current_story_points": current_story_points,
                    "current_status_id": current_status_id,
                    "start_date_diff_days": start_date_diff,
                    "end_date_diff_days": end_date_diff,
                    "hours_diff": hours_diff,
                    "story_points_diff": sp_diff,
                }
            )

        return {
            "baseline_id": baseline.id,
            "baseline_name": baseline.name,
            "variances": variances,
        }
