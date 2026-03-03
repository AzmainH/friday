from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.models.issue import Issue
from app.models.issue_relation import IssueActivityLog
from app.models.members import ProjectMember
from app.models.project import Project
from app.models.workflow import StatusCategory, WorkflowStatus
from app.repositories.dashboard import (
    CustomDashboardRepository,
    SavedReportRepository,
)


# ── Dashboard Service ────────────────────────────────────────────


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.dashboard_repo = CustomDashboardRepository(session)

    # ── Personal Dashboard ───────────────────────────────────────

    async def get_personal_dashboard(self, user_id: UUID) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        week_end = now + timedelta(days=(7 - now.weekday()))

        # Count issues assigned to user, grouped by overdue / due-this-week
        base = (
            select(
                func.count(Issue.id).label("total"),
                func.count(
                    case(
                        (
                            and_(
                                Issue.planned_end < now.date(),
                                WorkflowStatus.category != StatusCategory.DONE,
                            ),
                            Issue.id,
                        ),
                    )
                ).label("overdue"),
                func.count(
                    case(
                        (
                            and_(
                                Issue.planned_end >= now.date(),
                                Issue.planned_end <= week_end.date(),
                                WorkflowStatus.category != StatusCategory.DONE,
                            ),
                            Issue.id,
                        ),
                    )
                ).label("due_this_week"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.assignee_id == user_id,
                Issue.is_deleted == False,  # noqa: E712
                WorkflowStatus.category != StatusCategory.DONE,
            )
        )
        result = await self.session.execute(base)
        row = result.one_or_none()
        total = row.total if row else 0
        overdue = row.overdue if row else 0
        due_this_week = row.due_this_week if row else 0

        # Recent activity for user's issues (last 20)
        activity_q = (
            select(
                IssueActivityLog.id,
                IssueActivityLog.issue_id,
                IssueActivityLog.action,
                IssueActivityLog.field_name,
                IssueActivityLog.old_value,
                IssueActivityLog.new_value,
                IssueActivityLog.created_at,
            )
            .join(Issue, IssueActivityLog.issue_id == Issue.id)
            .where(
                Issue.assignee_id == user_id,
                Issue.is_deleted == False,  # noqa: E712
            )
            .order_by(IssueActivityLog.created_at.desc())
            .limit(20)
        )
        activity_result = await self.session.execute(activity_q)
        recent_activity = [
            {
                "id": str(r.id),
                "issue_id": str(r.issue_id),
                "action": r.action,
                "field_name": r.field_name,
                "old_value": r.old_value,
                "new_value": r.new_value,
                "created_at": r.created_at.isoformat(),
            }
            for r in activity_result.all()
        ]

        # Projects user belongs to
        projects_q = (
            select(Project.id, Project.name, Project.key_prefix, Project.status)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(
                ProjectMember.user_id == user_id,
                Project.is_deleted == False,  # noqa: E712
            )
            .order_by(Project.name)
        )
        projects_result = await self.session.execute(projects_q)
        my_projects = [
            {
                "id": str(r.id),
                "name": r.name,
                "key_prefix": r.key_prefix,
                "status": str(r.status),
            }
            for r in projects_result.all()
        ]

        return {
            "assigned_to_me": total,
            "overdue": overdue,
            "due_this_week": due_this_week,
            "recent_activity": recent_activity,
            "my_projects": my_projects,
        }

    # ── Project Dashboard ────────────────────────────────────────

    async def get_project_dashboard(self, project_id: UUID) -> dict[str, Any]:
        now = datetime.now(timezone.utc)

        # Issue counts by status category
        status_q = (
            select(
                WorkflowStatus.category,
                func.count(Issue.id).label("cnt"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.project_id == project_id,
                Issue.is_deleted == False,  # noqa: E712
            )
            .group_by(WorkflowStatus.category)
        )
        status_result = await self.session.execute(status_q)
        issue_counts_by_status: dict[str, int] = {
            str(r.category): r.cnt for r in status_result.all()
        }

        # Issue counts by priority
        priority_q = (
            select(
                Issue.priority,
                func.count(Issue.id).label("cnt"),
            )
            .where(
                Issue.project_id == project_id,
                Issue.is_deleted == False,  # noqa: E712
            )
            .group_by(Issue.priority)
        )
        priority_result = await self.session.execute(priority_q)
        issue_counts_by_priority: dict[str, int] = {
            r.priority: r.cnt for r in priority_result.all()
        }

        # Progress percentage and overdue count
        progress_q = select(
            func.count(Issue.id).label("total"),
            func.count(
                case(
                    (WorkflowStatus.category == StatusCategory.DONE, Issue.id),
                )
            ).label("done"),
            func.count(
                case(
                    (
                        and_(
                            Issue.planned_end < now.date(),
                            WorkflowStatus.category != StatusCategory.DONE,
                        ),
                        Issue.id,
                    ),
                )
            ).label("overdue"),
        ).join(
            WorkflowStatus, Issue.status_id == WorkflowStatus.id
        ).where(
            Issue.project_id == project_id,
            Issue.is_deleted == False,  # noqa: E712
        )
        progress_result = await self.session.execute(progress_q)
        prow = progress_result.one()
        total = prow.total or 0
        done = prow.done or 0
        progress_pct = round((done / total * 100.0) if total > 0 else 0.0, 2)

        # Burndown data — issues created/resolved by week over last 12 weeks
        twelve_weeks_ago = now - timedelta(weeks=12)
        week_trunc = func.date_trunc("week", Issue.created_at)
        burndown_q = (
            select(
                week_trunc.label("week"),
                func.count(Issue.id).label("created"),
                func.count(
                    case(
                        (WorkflowStatus.category == StatusCategory.DONE, Issue.id),
                    )
                ).label("resolved"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.project_id == project_id,
                Issue.is_deleted == False,  # noqa: E712
                Issue.created_at >= twelve_weeks_ago,
            )
            .group_by(week_trunc)
            .order_by(week_trunc)
        )
        burndown_result = await self.session.execute(burndown_q)
        burndown_data = [
            {
                "week": r.week.isoformat(),
                "created": r.created,
                "resolved": r.resolved,
            }
            for r in burndown_result.all()
        ]

        # Velocity data — story points completed per week over last 12 weeks
        vel_week = func.date_trunc("week", Issue.updated_at)
        velocity_q = (
            select(
                vel_week.label("week"),
                func.coalesce(func.sum(Issue.story_points), 0).label("points"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.project_id == project_id,
                Issue.is_deleted == False,  # noqa: E712
                WorkflowStatus.category == StatusCategory.DONE,
                Issue.updated_at >= twelve_weeks_ago,
            )
            .group_by(vel_week)
            .order_by(vel_week)
        )
        velocity_result = await self.session.execute(velocity_q)
        velocity_data = [
            {
                "week": r.week.isoformat(),
                "points": int(r.points),
            }
            for r in velocity_result.all()
        ]

        return {
            "issue_counts_by_status": issue_counts_by_status,
            "issue_counts_by_priority": issue_counts_by_priority,
            "progress_pct": progress_pct,
            "overdue_count": prow.overdue,
            "burndown_data": burndown_data,
            "velocity_data": velocity_data,
        }

    # ── Portfolio Dashboard ──────────────────────────────────────

    async def get_portfolio_dashboard(
        self, workspace_id: UUID
    ) -> dict[str, Any]:
        # Projects by status
        proj_status_q = (
            select(
                Project.status,
                func.count(Project.id).label("cnt"),
            )
            .where(
                Project.workspace_id == workspace_id,
                Project.is_deleted == False,  # noqa: E712
            )
            .group_by(Project.status)
        )
        proj_status_result = await self.session.execute(proj_status_q)
        projects_by_status: dict[str, int] = {
            str(r.status): r.cnt for r in proj_status_result.all()
        }

        # Projects by RAG status
        proj_rag_q = (
            select(
                Project.rag_status,
                func.count(Project.id).label("cnt"),
            )
            .where(
                Project.workspace_id == workspace_id,
                Project.is_deleted == False,  # noqa: E712
            )
            .group_by(Project.rag_status)
        )
        proj_rag_result = await self.session.execute(proj_rag_q)
        projects_by_rag: dict[str, int] = {
            str(r.rag_status): r.cnt for r in proj_rag_result.all()
        }

        # Total issues across all workspace projects + completion rate
        issues_q = (
            select(
                func.count(Issue.id).label("total"),
                func.count(
                    case(
                        (WorkflowStatus.category == StatusCategory.DONE, Issue.id),
                    )
                ).label("done"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .join(Project, Issue.project_id == Project.id)
            .where(
                Project.workspace_id == workspace_id,
                Project.is_deleted == False,  # noqa: E712
                Issue.is_deleted == False,  # noqa: E712
            )
        )
        issues_result = await self.session.execute(issues_q)
        irow = issues_result.one()
        total_issues = irow.total or 0
        done_issues = irow.done or 0
        completion_rate = round(
            (done_issues / total_issues * 100.0) if total_issues > 0 else 0.0, 2
        )

        return {
            "projects_by_status": projects_by_status,
            "projects_by_rag": projects_by_rag,
            "total_issues": total_issues,
            "completion_rate": completion_rate,
        }

    # ── Custom Dashboard CRUD ────────────────────────────────────

    async def list_dashboards(
        self, user_id: UUID, *, cursor: str | None = None, limit: int = 50,
        include_count: bool = False,
    ) -> dict[str, Any]:
        return await self.dashboard_repo.get_by_owner(
            user_id, cursor=cursor, limit=limit, include_count=include_count,
        )

    async def get_dashboard(self, dashboard_id: UUID) -> Any:
        dashboard = await self.dashboard_repo.get_by_id(dashboard_id)
        if not dashboard:
            raise NotFoundException("Custom dashboard not found")
        return dashboard

    async def create_dashboard(
        self, data: dict[str, Any], *, created_by: UUID | None = None,
    ) -> Any:
        return await self.dashboard_repo.create(data, created_by=created_by)

    async def update_dashboard(
        self,
        dashboard_id: UUID,
        data: dict[str, Any],
        *,
        updated_by: UUID | None = None,
    ) -> Any:
        dashboard = await self.dashboard_repo.get_by_id(dashboard_id)
        if not dashboard:
            raise NotFoundException("Custom dashboard not found")
        updated = await self.dashboard_repo.update(
            dashboard_id, data, updated_by=updated_by,
        )
        if not updated:
            raise NotFoundException("Custom dashboard not found")
        return updated

    async def delete_dashboard(
        self, dashboard_id: UUID,
    ) -> bool:
        deleted = await self.dashboard_repo.hard_delete(dashboard_id)
        if not deleted:
            raise NotFoundException("Custom dashboard not found")
        return True


# ── Report Service ───────────────────────────────────────────────


class ReportService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.report_repo = SavedReportRepository(session)

    # ── Run report by type ───────────────────────────────────────

    async def run_report(
        self, report_type: str, config: dict[str, Any],
    ) -> dict[str, Any]:
        handler = self._get_handler(report_type)
        data = await handler(config)
        return {
            "report_type": report_type,
            "data": data,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    def _get_handler(self, report_type: str):
        handlers = {
            "velocity": self._report_velocity,
            "burndown": self._report_burndown,
            "burnup": self._report_burnup,
            "cumulative_flow": self._report_cumulative_flow,
            "lead_time": self._report_lead_time,
            "cycle_time": self._report_cycle_time,
            "created_vs_resolved": self._report_created_vs_resolved,
        }
        handler = handlers.get(report_type)
        if not handler:
            raise NotFoundException(
                f"Unknown report type: {report_type}"
            )
        return handler

    async def _report_velocity(self, config: dict[str, Any]) -> list[dict]:
        project_id = config.get("project_id")
        weeks = config.get("weeks", 12)
        cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)

        query = (
            select(
                func.date_trunc("week", Issue.updated_at).label("week"),
                func.coalesce(func.sum(Issue.story_points), 0).label("points"),
                func.count(Issue.id).label("issues_completed"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                WorkflowStatus.category == StatusCategory.DONE,
                Issue.is_deleted == False,  # noqa: E712
                Issue.updated_at >= cutoff,
            )
        )
        if project_id:
            query = query.where(Issue.project_id == UUID(str(project_id)))
        query = query.group_by(
            func.date_trunc("week", Issue.updated_at)
        ).order_by(func.date_trunc("week", Issue.updated_at))

        result = await self.session.execute(query)
        return [
            {
                "week": r.week.isoformat(),
                "points": int(r.points),
                "issues_completed": r.issues_completed,
            }
            for r in result.all()
        ]

    async def _report_burndown(self, config: dict[str, Any]) -> list[dict]:
        project_id = config.get("project_id")
        weeks = config.get("weeks", 12)
        cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)

        query = (
            select(
                func.date_trunc("week", Issue.created_at).label("week"),
                func.count(Issue.id).label("created"),
                func.count(
                    case(
                        (WorkflowStatus.category == StatusCategory.DONE, Issue.id),
                    )
                ).label("resolved"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.is_deleted == False,  # noqa: E712
                Issue.created_at >= cutoff,
            )
        )
        if project_id:
            query = query.where(Issue.project_id == UUID(str(project_id)))
        query = query.group_by(
            func.date_trunc("week", Issue.created_at)
        ).order_by(func.date_trunc("week", Issue.created_at))

        result = await self.session.execute(query)
        rows = result.all()

        # Build running remaining total
        remaining = 0
        data = []
        for r in rows:
            remaining += r.created - r.resolved
            data.append({
                "week": r.week.isoformat(),
                "created": r.created,
                "resolved": r.resolved,
                "remaining": remaining,
            })
        return data

    async def _report_burnup(self, config: dict[str, Any]) -> list[dict]:
        project_id = config.get("project_id")
        weeks = config.get("weeks", 12)
        cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)

        query = (
            select(
                func.date_trunc("week", Issue.created_at).label("week"),
                func.count(Issue.id).label("total_created"),
                func.count(
                    case(
                        (WorkflowStatus.category == StatusCategory.DONE, Issue.id),
                    )
                ).label("total_done"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.is_deleted == False,  # noqa: E712
                Issue.created_at >= cutoff,
            )
        )
        if project_id:
            query = query.where(Issue.project_id == UUID(str(project_id)))
        query = query.group_by(
            func.date_trunc("week", Issue.created_at)
        ).order_by(func.date_trunc("week", Issue.created_at))

        result = await self.session.execute(query)
        rows = result.all()

        cumulative_scope = 0
        cumulative_done = 0
        data = []
        for r in rows:
            cumulative_scope += r.total_created
            cumulative_done += r.total_done
            data.append({
                "week": r.week.isoformat(),
                "scope": cumulative_scope,
                "done": cumulative_done,
            })
        return data

    async def _report_cumulative_flow(
        self, config: dict[str, Any],
    ) -> list[dict]:
        project_id = config.get("project_id")
        weeks = config.get("weeks", 12)
        cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)

        query = (
            select(
                func.date_trunc("week", Issue.created_at).label("week"),
                WorkflowStatus.category,
                func.count(Issue.id).label("cnt"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.is_deleted == False,  # noqa: E712
                Issue.created_at >= cutoff,
            )
        )
        if project_id:
            query = query.where(Issue.project_id == UUID(str(project_id)))
        query = query.group_by(
            func.date_trunc("week", Issue.created_at),
            WorkflowStatus.category,
        ).order_by(func.date_trunc("week", Issue.created_at))

        result = await self.session.execute(query)
        return [
            {
                "week": r.week.isoformat(),
                "category": str(r.category),
                "count": r.cnt,
            }
            for r in result.all()
        ]

    async def _report_lead_time(self, config: dict[str, Any]) -> list[dict]:
        """Lead time = created_at to actual_end (done)."""
        project_id = config.get("project_id")
        weeks = config.get("weeks", 12)
        cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)

        query = (
            select(
                func.date_trunc("week", Issue.actual_end).label("week"),
                func.avg(
                    func.extract(
                        "epoch",
                        func.cast(Issue.actual_end, pg_timestamp())
                        - Issue.created_at,
                    )
                    / 86400
                ).label("avg_days"),
                func.count(Issue.id).label("sample_size"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.is_deleted == False,  # noqa: E712
                WorkflowStatus.category == StatusCategory.DONE,
                Issue.actual_end.is_not(None),
                Issue.actual_end >= cutoff.date(),
            )
        )
        if project_id:
            query = query.where(Issue.project_id == UUID(str(project_id)))
        query = query.group_by(
            func.date_trunc("week", Issue.actual_end)
        ).order_by(func.date_trunc("week", Issue.actual_end))

        result = await self.session.execute(query)
        return [
            {
                "week": r.week.isoformat(),
                "avg_lead_time_days": round(float(r.avg_days), 2) if r.avg_days else 0,
                "sample_size": r.sample_size,
            }
            for r in result.all()
        ]

    async def _report_cycle_time(self, config: dict[str, Any]) -> list[dict]:
        """Cycle time = actual_start to actual_end."""
        project_id = config.get("project_id")
        weeks = config.get("weeks", 12)
        cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)

        query = (
            select(
                func.date_trunc("week", Issue.actual_end).label("week"),
                func.avg(
                    func.extract(
                        "epoch",
                        func.cast(Issue.actual_end, pg_timestamp())
                        - func.cast(Issue.actual_start, pg_timestamp()),
                    )
                    / 86400
                ).label("avg_days"),
                func.count(Issue.id).label("sample_size"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.is_deleted == False,  # noqa: E712
                WorkflowStatus.category == StatusCategory.DONE,
                Issue.actual_start.is_not(None),
                Issue.actual_end.is_not(None),
                Issue.actual_end >= cutoff.date(),
            )
        )
        if project_id:
            query = query.where(Issue.project_id == UUID(str(project_id)))
        query = query.group_by(
            func.date_trunc("week", Issue.actual_end)
        ).order_by(func.date_trunc("week", Issue.actual_end))

        result = await self.session.execute(query)
        return [
            {
                "week": r.week.isoformat(),
                "avg_cycle_time_days": round(float(r.avg_days), 2) if r.avg_days else 0,
                "sample_size": r.sample_size,
            }
            for r in result.all()
        ]

    async def _report_created_vs_resolved(
        self, config: dict[str, Any],
    ) -> list[dict]:
        project_id = config.get("project_id")
        weeks = config.get("weeks", 12)
        cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)

        query = (
            select(
                func.date_trunc("week", Issue.created_at).label("week"),
                func.count(Issue.id).label("created"),
                func.count(
                    case(
                        (WorkflowStatus.category == StatusCategory.DONE, Issue.id),
                    )
                ).label("resolved"),
            )
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.is_deleted == False,  # noqa: E712
                Issue.created_at >= cutoff,
            )
        )
        if project_id:
            query = query.where(Issue.project_id == UUID(str(project_id)))
        query = query.group_by(
            func.date_trunc("week", Issue.created_at)
        ).order_by(func.date_trunc("week", Issue.created_at))

        result = await self.session.execute(query)
        return [
            {
                "week": r.week.isoformat(),
                "created": r.created,
                "resolved": r.resolved,
            }
            for r in result.all()
        ]

    # ── Saved Report CRUD ────────────────────────────────────────

    async def list_reports(
        self, user_id: UUID, *, cursor: str | None = None, limit: int = 50,
        include_count: bool = False,
    ) -> dict[str, Any]:
        return await self.report_repo.get_by_owner(
            user_id, cursor=cursor, limit=limit, include_count=include_count,
        )

    async def get_report(self, report_id: UUID) -> Any:
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise NotFoundException("Saved report not found")
        return report

    async def create_report(
        self, data: dict[str, Any], *, created_by: UUID | None = None,
    ) -> Any:
        return await self.report_repo.create(data, created_by=created_by)

    async def update_report(
        self,
        report_id: UUID,
        data: dict[str, Any],
        *,
        updated_by: UUID | None = None,
    ) -> Any:
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise NotFoundException("Saved report not found")
        updated = await self.report_repo.update(
            report_id, data, updated_by=updated_by,
        )
        if not updated:
            raise NotFoundException("Saved report not found")
        return updated

    async def delete_report(self, report_id: UUID) -> bool:
        deleted = await self.report_repo.hard_delete(report_id)
        if not deleted:
            raise NotFoundException("Saved report not found")
        return True

    async def run_saved_report(self, report_id: UUID) -> dict[str, Any]:
        report = await self.get_report(report_id)
        return await self.run_report(report.report_type, report.config_json or {})


def pg_timestamp():
    """Return a SQLAlchemy type for casting date to timestamp."""
    from sqlalchemy import DateTime

    return DateTime(timezone=True)
