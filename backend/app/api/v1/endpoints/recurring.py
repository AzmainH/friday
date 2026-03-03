from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.recurring import (
    RecurringRuleCreate,
    RecurringRuleResponse,
    RecurringRuleUpdate,
)
from app.services.recurring import RecurringService

router = APIRouter(tags=["recurring-rules"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Scoped under projects ──────────────────────────────────────


@router.get(
    "/projects/{project_id}/recurring-rules",
    response_model=CursorPage[RecurringRuleResponse],
)
async def list_recurring_rules(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = RecurringService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/recurring-rules",
    response_model=RecurringRuleResponse,
    status_code=201,
)
async def create_recurring_rule(
    project_id: UUID,
    body: RecurringRuleCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RecurringService(session)
    data = body.model_dump()
    return await service.create_rule(project_id, data, created_by=user_id)


# ── Direct recurring-rule routes ──────────────────────────────


@router.get("/recurring-rules/{rule_id}", response_model=RecurringRuleResponse)
async def get_recurring_rule(
    rule_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RecurringService(session)
    return await service.get_rule(rule_id)


@router.patch("/recurring-rules/{rule_id}", response_model=RecurringRuleResponse)
async def update_recurring_rule(
    rule_id: UUID,
    body: RecurringRuleUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RecurringService(session)
    return await service.update_rule(
        rule_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/recurring-rules/{rule_id}", response_model=MessageResponse)
async def delete_recurring_rule(
    rule_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RecurringService(session)
    await service.delete_rule(rule_id)
    return MessageResponse(message="Recurring rule deleted")


@router.post(
    "/recurring-rules/{rule_id}/trigger",
    response_model=RecurringRuleResponse,
)
async def trigger_recurring_rule(
    rule_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RecurringService(session)
    return await service.trigger_rule(rule_id, triggered_by=user_id)
