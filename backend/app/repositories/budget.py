from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import CostEntry, ProjectBudget
from app.repositories.base import BaseRepository


class ProjectBudgetRepository(BaseRepository[ProjectBudget]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ProjectBudget)

    async def get_by_project(self, project_id: UUID) -> ProjectBudget | None:
        query = select(ProjectBudget).where(
            ProjectBudget.project_id == project_id
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class CostEntryRepository(BaseRepository[CostEntry]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CostEntry)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_summary(self, project_id: UUID) -> dict[str, float]:
        """Return total spent grouped by category for a project."""
        query = (
            select(
                CostEntry.category,
                func.sum(CostEntry.amount).label("total"),
            )
            .where(CostEntry.project_id == project_id)
            .group_by(CostEntry.category)
        )
        result = await self.session.execute(query)
        rows = result.all()
        return {str(row.category): float(row.total) for row in rows}

    async def get_monthly_burn(
        self, project_id: UUID
    ) -> list[dict[str, Any]]:
        """Return monthly spend totals ordered chronologically."""
        year_col = extract("year", CostEntry.entry_date)
        month_col = extract("month", CostEntry.entry_date)

        query = (
            select(
                year_col.label("year"),
                month_col.label("month"),
                func.sum(CostEntry.amount).label("total"),
            )
            .where(CostEntry.project_id == project_id)
            .group_by(year_col, month_col)
            .order_by(year_col, month_col)
        )
        result = await self.session.execute(query)
        rows = result.all()
        return [
            {
                "month": f"{int(row.year)}-{int(row.month):02d}",
                "amount": float(row.total),
            }
            for row in rows
        ]
