from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.repositories.stakeholder import StakeholderRepository


def _compute_quadrant(interest_level: int, influence_level: int) -> str:
    """Compute stakeholder quadrant from interest and influence levels.

    Uses a threshold of 3 (midpoint of 1-5 scale):
    - High influence, High interest  -> "manage_closely"
    - High influence, Low interest   -> "keep_satisfied"
    - Low influence, High interest   -> "keep_informed"
    - Low influence, Low interest    -> "monitor"
    """
    high_interest = interest_level >= 3
    high_influence = influence_level >= 3

    if high_influence and high_interest:
        return "manage_closely"
    elif high_influence and not high_interest:
        return "keep_satisfied"
    elif not high_influence and high_interest:
        return "keep_informed"
    else:
        return "monitor"


class StakeholderService:
    def __init__(self, session: AsyncSession):
        self.repo = StakeholderRepository(session)

    async def get_stakeholder(self, stakeholder_id: UUID):
        stakeholder = await self.repo.get_by_id(stakeholder_id)
        if not stakeholder:
            raise NotFoundException("Stakeholder not found")
        return stakeholder

    async def list_by_project(self, project_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_project(project_id, **kwargs)

    async def create_stakeholder(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ):
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def update_stakeholder(
        self,
        stakeholder_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ):
        await self.get_stakeholder(stakeholder_id)
        updated = await self.repo.update(
            stakeholder_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Stakeholder not found")
        return updated

    async def delete_stakeholder(
        self, stakeholder_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(
            stakeholder_id, deleted_by=deleted_by
        )
        if not deleted:
            raise NotFoundException("Stakeholder not found")
        return True

    async def get_matrix(self, project_id: UUID) -> list[dict]:
        result = await self.repo.get_by_project(
            project_id, limit=100, include_count=False
        )
        entries = []
        for s in result["data"]:
            entries.append(
                {
                    "id": s.id,
                    "name": s.name,
                    "interest_level": s.interest_level,
                    "influence_level": s.influence_level,
                    "quadrant": _compute_quadrant(
                        s.interest_level, s.influence_level
                    ),
                }
            )
        return entries
