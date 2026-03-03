from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.issue import Issue
from app.models.project import Project
from app.models.roadmap import RoadmapPlan, RoadmapPlanProject, RoadmapScenario
from app.repositories.roadmap import (
    RoadmapPlanProjectRepository,
    RoadmapPlanRepository,
    RoadmapScenarioRepository,
)


class RoadmapService:
    def __init__(self, session: AsyncSession):
        self.plan_repo = RoadmapPlanRepository(session)
        self.plan_project_repo = RoadmapPlanProjectRepository(session)
        self.scenario_repo = RoadmapScenarioRepository(session)
        self.session = session

    # ── Plans ────────────────────────────────────────────────────────

    async def get_plan(self, plan_id: UUID) -> RoadmapPlan:
        plan = await self.plan_repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundException("Roadmap plan not found")
        return plan

    async def list_plans(
        self,
        workspace_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.plan_repo.get_by_workspace(
            workspace_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_plan(
        self, data: dict, *, created_by: UUID | None = None
    ) -> RoadmapPlan:
        return await self.plan_repo.create(data, created_by=created_by)

    async def update_plan(
        self,
        plan_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> RoadmapPlan:
        await self.get_plan(plan_id)
        updated = await self.plan_repo.update(
            plan_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Roadmap plan not found")
        return updated

    async def delete_plan(self, plan_id: UUID) -> bool:
        await self.get_plan(plan_id)
        deleted = await self.plan_repo.hard_delete(plan_id)
        if not deleted:
            raise NotFoundException("Roadmap plan not found")
        return True

    # ── Plan Projects ────────────────────────────────────────────────

    async def add_project(
        self,
        plan_id: UUID,
        data: dict,
    ) -> RoadmapPlanProject:
        await self.get_plan(plan_id)
        existing = await self.plan_project_repo.get_by_plan_and_project(
            plan_id, data["project_id"]
        )
        if existing:
            raise ConflictException(
                "Project is already added to this roadmap plan"
            )
        data["plan_id"] = plan_id
        return await self.plan_project_repo.create(data)

    async def remove_project(
        self, plan_id: UUID, project_id: UUID
    ) -> bool:
        await self.get_plan(plan_id)
        link = await self.plan_project_repo.get_by_plan_and_project(
            plan_id, project_id
        )
        if not link:
            raise NotFoundException(
                "Project not found in this roadmap plan"
            )
        deleted = await self.plan_project_repo.hard_delete(link.id)
        if not deleted:
            raise NotFoundException(
                "Project not found in this roadmap plan"
            )
        return True

    # ── Timeline ─────────────────────────────────────────────────────

    async def get_timeline(self, plan_id: UUID) -> list[dict]:
        plan = await self.plan_repo.get_with_projects(plan_id)
        if not plan:
            raise NotFoundException("Roadmap plan not found")

        if not plan.plan_projects:
            return []

        project_ids = [pp.project_id for pp in plan.plan_projects]

        # Fetch projects
        proj_query = select(Project).where(Project.id.in_(project_ids))
        proj_result = await self.session.execute(proj_query)
        projects = {p.id: p for p in proj_result.scalars().all()}

        # Fetch issues for all projects in the plan
        issue_query = select(Issue).where(
            Issue.project_id.in_(project_ids),
        )
        if hasattr(Issue, "is_deleted"):
            issue_query = issue_query.where(Issue.is_deleted == False)  # noqa: E712
        issue_result = await self.session.execute(issue_query)
        issues = list(issue_result.scalars().all())

        # Group issues by project
        issues_by_project: dict[UUID, list] = {pid: [] for pid in project_ids}
        for issue in issues:
            if issue.project_id in issues_by_project:
                issues_by_project[issue.project_id].append(
                    {
                        "id": issue.id,
                        "key": issue.issue_key,
                        "summary": issue.summary,
                        "start": issue.planned_start,
                        "end": issue.planned_end,
                        "assignee_id": issue.assignee_id,
                    }
                )

        timeline_items = []
        for pp in sorted(plan.plan_projects, key=lambda x: x.sort_order):
            project = projects.get(pp.project_id)
            if not project:
                continue
            timeline_items.append(
                {
                    "project_id": project.id,
                    "project_name": project.name,
                    "issues": issues_by_project.get(project.id, []),
                }
            )

        return timeline_items

    # ── Scenarios ────────────────────────────────────────────────────

    async def list_scenarios(
        self,
        plan_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        await self.get_plan(plan_id)
        return await self.scenario_repo.get_by_plan(
            plan_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_scenario(
        self,
        plan_id: UUID,
        data: dict,
        *,
        created_by: UUID | None = None,
    ) -> RoadmapScenario:
        await self.get_plan(plan_id)
        data["plan_id"] = plan_id
        return await self.scenario_repo.create(data, created_by=created_by)
