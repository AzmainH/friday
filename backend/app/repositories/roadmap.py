from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.roadmap import (
    RoadmapPlan,
    RoadmapPlanProject,
    RoadmapScenario,
    RoadmapScenarioOverride,
)
from app.repositories.base import BaseRepository


class RoadmapPlanRepository(BaseRepository[RoadmapPlan]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RoadmapPlan)

    async def get_by_workspace(
        self, workspace_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"workspace_id": workspace_id}, **kwargs
        )

    async def get_with_projects(self, plan_id: UUID) -> RoadmapPlan | None:
        query = (
            select(RoadmapPlan)
            .where(RoadmapPlan.id == plan_id)
            .options(selectinload(RoadmapPlan.plan_projects))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class RoadmapPlanProjectRepository(BaseRepository[RoadmapPlanProject]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RoadmapPlanProject)

    async def get_by_plan_and_project(
        self, plan_id: UUID, project_id: UUID
    ) -> RoadmapPlanProject | None:
        query = select(RoadmapPlanProject).where(
            RoadmapPlanProject.plan_id == plan_id,
            RoadmapPlanProject.project_id == project_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class RoadmapScenarioRepository(BaseRepository[RoadmapScenario]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RoadmapScenario)

    async def get_by_plan(
        self, plan_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"plan_id": plan_id}, **kwargs
        )

    async def get_with_overrides(
        self, scenario_id: UUID
    ) -> RoadmapScenario | None:
        query = (
            select(RoadmapScenario)
            .where(RoadmapScenario.id == scenario_id)
            .options(selectinload(RoadmapScenario.overrides))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class RoadmapScenarioOverrideRepository(BaseRepository[RoadmapScenarioOverride]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RoadmapScenarioOverride)
