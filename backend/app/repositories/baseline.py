from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.baseline import Baseline, BaselineSnapshot
from app.repositories.base import BaseRepository


class BaselineRepository(BaseRepository[Baseline]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Baseline)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_with_snapshots(self, baseline_id: UUID) -> Baseline | None:
        query = (
            select(Baseline)
            .where(Baseline.id == baseline_id)
            .options(selectinload(Baseline.snapshots))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class BaselineSnapshotRepository(BaseRepository[BaselineSnapshot]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, BaselineSnapshot)

    async def get_by_baseline(
        self, baseline_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"baseline_id": baseline_id}, **kwargs
        )

    async def bulk_create(
        self, snapshots: list[dict[str, Any]]
    ) -> list[BaselineSnapshot]:
        db_objects = []
        for snapshot_data in snapshots:
            db_obj = BaselineSnapshot(**snapshot_data)
            self.session.add(db_obj)
            db_objects.append(db_obj)
        await self.session.flush()
        for db_obj in db_objects:
            await self.session.refresh(db_obj)
        return db_objects
