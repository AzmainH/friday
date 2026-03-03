from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.budget import CostEntry, ProjectBudget
from app.models.issue import Issue
from app.models.portfolio import CrossProjectDependency, Release, ReleaseProject
from app.models.project import Project
from app.repositories.portfolio import (
    CrossProjectDependencyRepository,
    ReleaseProjectRepository,
    ReleaseRepository,
)
from app.schemas.portfolio import (
    AffectedProjectDetail,
    ImpactAnalysisResponse,
    PortfolioOverviewResponse,
    PortfolioProjectResponse,
)


class PortfolioService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_overview(self, workspace_id: UUID) -> PortfolioOverviewResponse:
        """Aggregate project health metrics for a workspace portfolio view."""
        # Fetch all active projects in the workspace
        project_query = select(Project).where(
            Project.workspace_id == workspace_id,
        )
        if hasattr(Project, "is_deleted"):
            project_query = project_query.where(
                Project.is_deleted == False  # noqa: E712
            )
        result = await self.session.execute(project_query)
        projects = list(result.scalars().all())

        if not projects:
            return PortfolioOverviewResponse(
                projects=[], total_budget=0.0, total_spent=0.0
            )

        project_ids = [p.id for p in projects]

        # Count issues per project
        issue_counts_query = (
            select(Issue.project_id, func.count(Issue.id))
            .where(Issue.project_id.in_(project_ids))
        )
        if hasattr(Issue, "is_deleted"):
            issue_counts_query = issue_counts_query.where(
                Issue.is_deleted == False  # noqa: E712
            )
        issue_counts_query = issue_counts_query.group_by(Issue.project_id)
        issue_counts_result = await self.session.execute(issue_counts_query)
        issue_counts = dict(issue_counts_result.all())

        # Count overdue issues per project (planned_end < today and not 100% complete)
        from datetime import date

        overdue_query = (
            select(Issue.project_id, func.count(Issue.id))
            .where(
                Issue.project_id.in_(project_ids),
                Issue.planned_end < date.today(),
                Issue.percent_complete < 100,
            )
        )
        if hasattr(Issue, "is_deleted"):
            overdue_query = overdue_query.where(
                Issue.is_deleted == False  # noqa: E712
            )
        overdue_query = overdue_query.group_by(Issue.project_id)
        overdue_result = await self.session.execute(overdue_query)
        overdue_counts = dict(overdue_result.all())

        # Average progress per project
        progress_query = (
            select(
                Issue.project_id,
                func.coalesce(func.avg(Issue.percent_complete), 0),
            )
            .where(Issue.project_id.in_(project_ids))
        )
        if hasattr(Issue, "is_deleted"):
            progress_query = progress_query.where(
                Issue.is_deleted == False  # noqa: E712
            )
        progress_query = progress_query.group_by(Issue.project_id)
        progress_result = await self.session.execute(progress_query)
        progress_map = dict(progress_result.all())

        # Budget totals
        budget_query = select(
            func.coalesce(func.sum(ProjectBudget.total_budget), 0)
        ).where(ProjectBudget.project_id.in_(project_ids))
        total_budget = await self.session.scalar(budget_query) or 0.0

        spent_query = select(
            func.coalesce(func.sum(CostEntry.amount), 0)
        ).where(CostEntry.project_id.in_(project_ids))
        total_spent = await self.session.scalar(spent_query) or 0.0

        portfolio_projects = []
        for project in projects:
            portfolio_projects.append(
                PortfolioProjectResponse(
                    project_id=project.id,
                    name=project.name,
                    key_prefix=project.key_prefix,
                    status=project.status.value if hasattr(project.status, "value") else str(project.status),
                    rag_status=project.rag_status.value if hasattr(project.rag_status, "value") else str(project.rag_status),
                    lead_id=project.lead_id,
                    progress_pct=float(progress_map.get(project.id, 0)),
                    issue_count=issue_counts.get(project.id, 0),
                    overdue_count=overdue_counts.get(project.id, 0),
                )
            )

        return PortfolioOverviewResponse(
            projects=portfolio_projects,
            total_budget=float(total_budget),
            total_spent=float(total_spent),
        )


class ReleaseService:
    def __init__(self, session: AsyncSession):
        self.repo = ReleaseRepository(session)
        self.project_repo = ReleaseProjectRepository(session)
        self.session = session

    async def get_release(self, release_id: UUID) -> Release:
        release = await self.repo.get_by_id(release_id)
        if not release:
            raise NotFoundException("Release not found")
        return release

    async def list_by_workspace(
        self,
        workspace_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_workspace(
            workspace_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_release(
        self, workspace_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> Release:
        data["workspace_id"] = workspace_id
        return await self.repo.create(data, created_by=created_by)

    async def update_release(
        self,
        release_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> Release:
        await self.get_release(release_id)
        updated = await self.repo.update(
            release_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Release not found")
        return updated

    async def delete_release(self, release_id: UUID) -> bool:
        await self.get_release(release_id)
        deleted = await self.repo.hard_delete(release_id)
        if not deleted:
            raise NotFoundException("Release not found")
        return True

    async def add_project(
        self, release_id: UUID, project_id: UUID
    ) -> ReleaseProject:
        await self.get_release(release_id)
        existing = await self.project_repo.get_by_release_and_project(
            release_id, project_id
        )
        if existing:
            raise ConflictException(
                "Project is already associated with this release"
            )
        return await self.project_repo.create(
            {"release_id": release_id, "project_id": project_id}
        )

    async def remove_project(
        self, release_id: UUID, project_id: UUID
    ) -> bool:
        await self.get_release(release_id)
        existing = await self.project_repo.get_by_release_and_project(
            release_id, project_id
        )
        if not existing:
            raise NotFoundException(
                "Project is not associated with this release"
            )
        deleted = await self.project_repo.hard_delete(existing.id)
        if not deleted:
            raise NotFoundException("Release project association not found")
        return True


class DependencyService:
    def __init__(self, session: AsyncSession):
        self.repo = CrossProjectDependencyRepository(session)
        self.session = session

    async def get_dependency(
        self, dependency_id: UUID
    ) -> CrossProjectDependency:
        dep = await self.repo.get_by_id(dependency_id)
        if not dep:
            raise NotFoundException("Cross-project dependency not found")
        return dep

    async def list_by_workspace(
        self,
        workspace_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_all_for_workspace(
            workspace_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_dependency(
        self, data: dict, *, created_by: UUID | None = None
    ) -> CrossProjectDependency:
        if data["source_project_id"] == data["target_project_id"]:
            raise ConflictException(
                "Source and target projects must be different"
            )
        return await self.repo.create(data, created_by=created_by)

    async def delete_dependency(self, dependency_id: UUID) -> bool:
        await self.get_dependency(dependency_id)
        deleted = await self.repo.hard_delete(dependency_id)
        if not deleted:
            raise NotFoundException("Cross-project dependency not found")
        return True

    async def analyze_impact(self, project_id: UUID) -> ImpactAnalysisResponse:
        """Trace the dependency chain for a project to find all affected projects."""
        visited: set[UUID] = set()
        affected: list[AffectedProjectDetail] = []

        await self._trace_dependencies(project_id, visited, affected)

        return ImpactAnalysisResponse(
            project_id=project_id,
            affected_projects=affected,
        )

    async def _trace_dependencies(
        self,
        project_id: UUID,
        visited: set[UUID],
        affected: list[AffectedProjectDetail],
    ) -> None:
        """Recursively trace dependency chain."""
        if project_id in visited:
            return
        visited.add(project_id)

        # Find all dependencies where this project is the source
        query = select(CrossProjectDependency).where(
            CrossProjectDependency.source_project_id == project_id,
        )
        result = await self.session.execute(query)
        deps = list(result.scalars().all())

        for dep in deps:
            target_id = dep.target_project_id
            if target_id not in visited:
                affected.append(
                    AffectedProjectDetail(
                        project_id=target_id,
                        dependency_type=dep.dependency_type,
                        impact_description=dep.description,
                    )
                )
                # Recurse into transitive dependencies
                await self._trace_dependencies(target_id, visited, affected)
