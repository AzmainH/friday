from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dashboard import CustomDashboard, SavedReport
from app.repositories.base import BaseRepository


class CustomDashboardRepository(BaseRepository[CustomDashboard]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CustomDashboard)

    async def get_by_owner(
        self, owner_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"owner_id": owner_id}, **kwargs
        )

    async def get_shared(self, **kwargs: Any) -> dict[str, Any]:
        return await self.get_multi(
            filters={"is_shared": True}, **kwargs
        )

    async def get_by_scope(
        self,
        scope: str,
        scope_id: UUID | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        filters: dict[str, Any] = {"scope": scope}
        if scope_id is not None:
            filters["scope_id"] = scope_id
        return await self.get_multi(filters=filters, **kwargs)


class SavedReportRepository(BaseRepository[SavedReport]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SavedReport)

    async def get_by_owner(
        self, owner_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"owner_id": owner_id}, **kwargs
        )

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )
