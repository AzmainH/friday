"""Resource capacity planning and utilization tracking."""

from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue import Issue
from app.models.members import ProjectMember, WorkspaceMember
from app.models.project import Project
from app.models.user import User


class ResourcePlanningService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_team_capacity(
        self, workspace_id: UUID, weeks: int = 4
    ) -> dict:
        """Get team capacity (available hours) per member for the next N weeks.

        Uses ``ProjectMember.hours_per_week`` when available, otherwise
        defaults to 40 hours/week.
        """
        query = (
            select(WorkspaceMember, User)
            .join(User, WorkspaceMember.user_id == User.id)
            .where(WorkspaceMember.workspace_id == workspace_id)
        )
        result = await self.session.execute(query)
        rows = result.all()

        # Lookup per-member hours_per_week across their project assignments
        member_ids = [wm.user_id for wm, _ in rows]
        hours_q = (
            select(
                ProjectMember.user_id,
                func.coalesce(func.avg(ProjectMember.hours_per_week), 40).label(
                    "avg_hours"
                ),
            )
            .join(Project, ProjectMember.project_id == Project.id)
            .where(
                ProjectMember.user_id.in_(member_ids),
                Project.workspace_id == workspace_id,
                Project.is_deleted == False,  # noqa: E712
            )
            .group_by(ProjectMember.user_id)
        )
        hours_result = await self.session.execute(hours_q)
        hours_map: dict[UUID, float] = {
            row.user_id: float(row.avg_hours) for row in hours_result.all()
        }

        members = []
        for wm, user in rows:
            weekly = hours_map.get(user.id, 40.0)
            members.append(
                {
                    "user_id": str(user.id),
                    "display_name": user.display_name or user.email,
                    "email": user.email,
                    "weekly_capacity_hours": round(weekly, 1),
                    "total_capacity_hours": round(weekly * weeks, 1),
                }
            )

        return {
            "members": members,
            "weeks": weeks,
            "hours_per_week": 40,
        }

    async def get_team_allocation(
        self, workspace_id: UUID, weeks: int = 4
    ) -> dict:
        """Get hours allocated per member across projects in the workspace."""
        member_query = select(WorkspaceMember.user_id).where(
            WorkspaceMember.workspace_id == workspace_id
        )
        member_result = await self.session.execute(member_query)
        member_ids = [row[0] for row in member_result.all()]

        if not member_ids:
            return {"allocations": [], "weeks": weeks}

        # Get assigned issues with estimated hours, filtered to workspace projects
        issue_query = (
            select(
                Issue.assignee_id,
                Issue.project_id,
                func.coalesce(func.sum(Issue.estimated_hours), 0).label(
                    "allocated_hours"
                ),
                func.count(Issue.id).label("issue_count"),
            )
            .join(Project, Issue.project_id == Project.id)
            .where(
                Issue.assignee_id.in_(member_ids),
                Issue.is_deleted == False,  # noqa: E712
                Project.workspace_id == workspace_id,
                Project.is_deleted == False,  # noqa: E712
            )
            .group_by(Issue.assignee_id, Issue.project_id)
        )
        issue_result = await self.session.execute(issue_query)

        # Group by member
        alloc_map: dict[UUID, list[dict]] = {mid: [] for mid in member_ids}
        total_map: dict[UUID, float] = {mid: 0.0 for mid in member_ids}

        for row in issue_result.all():
            hours = float(row.allocated_hours or 0)
            total_map[row.assignee_id] = total_map.get(row.assignee_id, 0) + hours
            alloc_map[row.assignee_id].append(
                {
                    "project_id": str(row.project_id),
                    "allocated_hours": round(hours, 1),
                    "issue_count": row.issue_count,
                }
            )

        allocations = [
            {
                "user_id": str(mid),
                "total_allocated_hours": round(total_map.get(mid, 0), 1),
                "projects": alloc_map.get(mid, []),
            }
            for mid in member_ids
        ]

        return {"allocations": allocations, "weeks": weeks}

    async def get_utilization_report(
        self, workspace_id: UUID, weeks: int = 4
    ) -> dict:
        """Get utilization % per member (allocated / capacity)."""
        capacity = await self.get_team_capacity(workspace_id, weeks)
        allocation = await self.get_team_allocation(workspace_id, weeks)

        allocation_map = {
            a["user_id"]: a["total_allocated_hours"]
            for a in allocation["allocations"]
        }

        utilization = []
        for member in capacity["members"]:
            allocated = allocation_map.get(member["user_id"], 0)
            capacity_hours = member["total_capacity_hours"]
            utilization_pct = (
                (allocated / capacity_hours * 100) if capacity_hours > 0 else 0
            )

            if utilization_pct > 100:
                status = "over"
            elif utilization_pct >= 70:
                status = "optimal"
            else:
                status = "under"

            utilization.append(
                {
                    "user_id": member["user_id"],
                    "display_name": member["display_name"],
                    "capacity_hours": capacity_hours,
                    "allocated_hours": round(allocated, 1),
                    "available_hours": round(capacity_hours - allocated, 1),
                    "utilization_percent": round(utilization_pct, 1),
                    "status": status,
                }
            )

        return {"utilization": utilization, "weeks": weeks}
