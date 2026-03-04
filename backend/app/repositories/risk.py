from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.risk import (
    Risk,
    RiskImpact,
    RiskProbability,
    RiskResponse,
    RiskStatus,
    _IMPACT_SCORES,
    _PROBABILITY_SCORES,
)
from app.repositories.base import BaseRepository


class RiskRepository(BaseRepository[Risk]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Risk)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_with_responses(self, risk_id: UUID) -> Risk | None:
        query = (
            select(Risk)
            .options(selectinload(Risk.responses))
            .where(Risk.id == risk_id)
        )
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_risk_matrix(self, project_id: UUID) -> list[dict[str, Any]]:
        """Return risks grouped by probability x impact for heat map display."""
        query = (
            select(
                Risk.probability,
                Risk.impact,
                func.count(Risk.id).label("count"),
            )
            .where(
                and_(
                    Risk.project_id == project_id,
                    Risk.is_deleted == False,  # noqa: E712
                    Risk.status.notin_(
                        [RiskStatus.RESOLVED, RiskStatus.CLOSED]
                    ),
                )
            )
            .group_by(Risk.probability, Risk.impact)
        )
        result = await self.session.execute(query)
        rows = result.all()
        return [
            {
                "probability": row.probability,
                "impact": row.impact,
                "probability_score": _PROBABILITY_SCORES[row.probability],
                "impact_score": _IMPACT_SCORES[row.impact],
                "count": row.count,
            }
            for row in rows
        ]

    async def get_overdue_risks(
        self, project_id: UUID, as_of: date | None = None
    ) -> list[Risk]:
        """Return risks that are past their due date and not resolved/closed."""
        check_date = as_of or date.today()
        query = (
            select(Risk)
            .where(
                and_(
                    Risk.project_id == project_id,
                    Risk.is_deleted == False,  # noqa: E712
                    Risk.due_date < check_date,
                    Risk.status.notin_(
                        [RiskStatus.RESOLVED, RiskStatus.CLOSED]
                    ),
                )
            )
            .order_by(Risk.due_date.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_summary(self, project_id: UUID) -> dict[str, Any]:
        """Return counts grouped by status and category."""
        base_filter = and_(
            Risk.project_id == project_id,
            Risk.is_deleted == False,  # noqa: E712
        )

        # Count by status
        status_query = (
            select(
                Risk.status,
                func.count(Risk.id).label("count"),
            )
            .where(base_filter)
            .group_by(Risk.status)
        )
        status_result = await self.session.execute(status_query)
        by_status = {row.status.value: row.count for row in status_result.all()}

        # Count by category
        category_query = (
            select(
                Risk.category,
                func.count(Risk.id).label("count"),
            )
            .where(base_filter)
            .group_by(Risk.category)
        )
        category_result = await self.session.execute(category_query)
        by_category = {
            row.category.value: row.count for row in category_result.all()
        }

        # Total and average score
        agg_query = select(
            func.count(Risk.id).label("total"),
            func.coalesce(func.avg(Risk.risk_score), 0).label("avg_score"),
        ).where(base_filter)
        agg_result = await self.session.execute(agg_query)
        agg = agg_result.one()

        return {
            "total": agg.total,
            "average_score": float(agg.avg_score),
            "by_status": by_status,
            "by_category": by_category,
        }


class RiskResponseRepository(BaseRepository[RiskResponse]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RiskResponse)

    async def get_by_risk(
        self, risk_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(filters={"risk_id": risk_id}, **kwargs)
