from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.budget import (
    BudgetSummaryResponse,
    CostEntryCreate,
    CostEntryResponse,
    MonthlyBurn,
    ProjectBudgetCreate,
    ProjectBudgetResponse,
    ProjectBudgetUpdate,
)
from app.services.budget import BudgetService

router = APIRouter(tags=["budgets"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Project Budget ──────────────────────────────────────────────


@router.get(
    "/projects/{project_id}/budget",
    response_model=ProjectBudgetResponse,
)
async def get_budget(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = BudgetService(session)
    return await service.get_budget(project_id)


@router.put(
    "/projects/{project_id}/budget",
    response_model=ProjectBudgetResponse,
)
async def create_or_update_budget(
    project_id: UUID,
    body: ProjectBudgetCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = BudgetService(session)
    data = body.model_dump(exclude_unset=True)
    return await service.update_budget(project_id, data, updated_by=user_id)


# ── Budget Summary ──────────────────────────────────────────────


@router.get(
    "/projects/{project_id}/budget/summary",
    response_model=BudgetSummaryResponse,
)
async def get_budget_summary(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = BudgetService(session)
    summary = await service.get_summary(project_id)
    return BudgetSummaryResponse(
        total_budget=summary["total_budget"],
        total_spent=summary["total_spent"],
        remaining=summary["remaining"],
        percent_used=summary["percent_used"],
        by_category=summary["by_category"],
        monthly_burn=[
            MonthlyBurn(month=m["month"], amount=m["amount"])
            for m in summary["monthly_burn"]
        ],
    )


# ── Cost Entries ────────────────────────────────────────────────


@router.get(
    "/projects/{project_id}/costs",
    response_model=CursorPage[CostEntryResponse],
)
async def list_cost_entries(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = BudgetService(session)
    result = await service.list_entries(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/costs",
    response_model=CostEntryResponse,
    status_code=201,
)
async def add_cost_entry(
    project_id: UUID,
    body: CostEntryCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = BudgetService(session)
    data = body.model_dump()
    return await service.add_cost_entry(project_id, data, created_by=user_id)


@router.delete("/costs/{cost_id}", response_model=MessageResponse)
async def delete_cost_entry(
    cost_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = BudgetService(session)
    await service.delete_entry(cost_id)
    return MessageResponse(message="Cost entry deleted")
