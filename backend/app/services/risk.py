from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.models.risk import (
    RiskImpact,
    RiskProbability,
    RiskStatus,
    compute_risk_score,
)
from app.repositories.risk import RiskRepository, RiskResponseRepository


class RiskService:
    def __init__(self, session: AsyncSession):
        self.repo = RiskRepository(session)
        self.response_repo = RiskResponseRepository(session)

    # -- helpers ---------------------------------------------------------------

    @staticmethod
    def _apply_score(data: dict[str, Any]) -> dict[str, Any]:
        """Compute risk_score whenever probability or impact is provided."""
        prob = data.get("probability")
        impact = data.get("impact")
        if prob is not None and impact is not None:
            data["risk_score"] = compute_risk_score(
                RiskProbability(prob), RiskImpact(impact)
            )
        return data

    @staticmethod
    def _apply_resolved_at(data: dict[str, Any]) -> dict[str, Any]:
        """Set resolved_at when status transitions to resolved or closed."""
        status = data.get("status")
        if status in (RiskStatus.RESOLVED.value, RiskStatus.CLOSED.value):
            data.setdefault("resolved_at", datetime.now(timezone.utc))
        return data

    # -- risk CRUD -------------------------------------------------------------

    async def get_risk(self, risk_id: UUID):
        risk = await self.repo.get_by_id(risk_id)
        if not risk:
            raise NotFoundException("Risk not found")
        return risk

    async def get_risk_with_responses(self, risk_id: UUID):
        risk = await self.repo.get_with_responses(risk_id)
        if not risk:
            raise NotFoundException("Risk not found")
        return risk

    async def list_by_project(self, project_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_project(project_id, **kwargs)

    async def create_risk(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ):
        data["project_id"] = project_id
        data = self._apply_score(data)
        data = self._apply_resolved_at(data)
        return await self.repo.create(data, created_by=created_by)

    async def update_risk(
        self,
        risk_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ):
        existing = await self.get_risk(risk_id)
        # Merge existing values with incoming so score can always be computed
        prob = data.get("probability", existing.probability.value)
        impact = data.get("impact", existing.impact.value)
        data["risk_score"] = compute_risk_score(
            RiskProbability(prob), RiskImpact(impact)
        )
        data = self._apply_resolved_at(data)
        updated = await self.repo.update(risk_id, data, updated_by=updated_by)
        if not updated:
            raise NotFoundException("Risk not found")
        return updated

    async def delete_risk(
        self, risk_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(risk_id, deleted_by=deleted_by)
        if not deleted:
            raise NotFoundException("Risk not found")
        return True

    # -- risk matrix & summary -------------------------------------------------

    async def get_risk_matrix(self, project_id: UUID) -> list[dict]:
        return await self.repo.get_risk_matrix(project_id)

    async def get_risk_summary(self, project_id: UUID) -> dict:
        return await self.repo.get_summary(project_id)

    # -- risk responses --------------------------------------------------------

    async def list_responses(self, risk_id: UUID, **kwargs) -> dict:
        await self.get_risk(risk_id)  # ensure parent exists
        return await self.response_repo.get_by_risk(risk_id, **kwargs)

    async def create_response(
        self,
        risk_id: UUID,
        data: dict,
        *,
        created_by: UUID | None = None,
    ):
        await self.get_risk(risk_id)
        data["risk_id"] = risk_id
        return await self.response_repo.create(data, created_by=created_by)

    async def update_response(
        self,
        response_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ):
        existing = await self.response_repo.get_by_id(response_id)
        if not existing:
            raise NotFoundException("Risk response not found")
        updated = await self.response_repo.update(
            response_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Risk response not found")
        return updated

    async def delete_response(
        self, response_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.response_repo.soft_delete(
            response_id, deleted_by=deleted_by
        )
        if not deleted:
            raise NotFoundException("Risk response not found")
        return True
