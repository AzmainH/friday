from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.repositories.budget import CostEntryRepository, ProjectBudgetRepository


class BudgetService:
    def __init__(self, session: AsyncSession):
        self.budget_repo = ProjectBudgetRepository(session)
        self.entry_repo = CostEntryRepository(session)

    # ── Budget CRUD ─────────────────────────────────────────────

    async def get_or_create_budget(
        self,
        project_id: UUID,
        data: dict,
        *,
        created_by: UUID | None = None,
    ):
        existing = await self.budget_repo.get_by_project(project_id)
        if existing:
            return existing
        data["project_id"] = project_id
        return await self.budget_repo.create(data, created_by=created_by)

    async def get_budget(self, project_id: UUID):
        budget = await self.budget_repo.get_by_project(project_id)
        if not budget:
            raise NotFoundException("Project budget not found")
        return budget

    async def update_budget(
        self,
        project_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ):
        budget = await self.budget_repo.get_by_project(project_id)
        if not budget:
            # Create a new budget when none exists yet
            data["project_id"] = project_id
            return await self.budget_repo.create(data, created_by=updated_by)
        updated = await self.budget_repo.update(
            budget.id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Project budget not found")
        return updated

    # ── Cost Entries ────────────────────────────────────────────

    async def add_cost_entry(
        self,
        project_id: UUID,
        data: dict,
        *,
        created_by: UUID | None = None,
    ):
        data["project_id"] = project_id
        return await self.entry_repo.create(data, created_by=created_by)

    async def list_entries(self, project_id: UUID, **kwargs) -> dict:
        return await self.entry_repo.get_by_project(project_id, **kwargs)

    async def delete_entry(self, cost_id: UUID) -> bool:
        deleted = await self.entry_repo.hard_delete(cost_id)
        if not deleted:
            raise NotFoundException("Cost entry not found")
        return True

    # ── Summary / Analytics ─────────────────────────────────────

    async def get_summary(self, project_id: UUID) -> dict:
        budget = await self.budget_repo.get_by_project(project_id)
        if not budget:
            raise NotFoundException("Project budget not found")

        by_category = await self.entry_repo.get_summary(project_id)
        monthly_burn = await self.entry_repo.get_monthly_burn(project_id)

        total_spent = sum(by_category.values())
        remaining = budget.total_budget - total_spent
        percent_used = (
            (total_spent / budget.total_budget * 100.0)
            if budget.total_budget > 0
            else 0.0
        )

        return {
            "total_budget": budget.total_budget,
            "total_spent": total_spent,
            "remaining": remaining,
            "percent_used": round(percent_used, 2),
            "by_category": by_category,
            "monthly_burn": monthly_burn,
        }
