from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.automation import (
    AutomationExecutionLogResponse,
    AutomationRuleCreate,
    AutomationRuleResponse,
    AutomationRuleUpdate,
    AutomationTestRequest,
    AutomationTestResponse,
)
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.services.automation import AutomationService

router = APIRouter(tags=["automations"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Scoped under projects ───────────────────────────────────────


@router.get(
    "/projects/{project_id}/automations",
    response_model=CursorPage[AutomationRuleResponse],
)
async def list_automations(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = AutomationService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/automations",
    response_model=AutomationRuleResponse,
    status_code=201,
)
async def create_automation(
    project_id: UUID,
    body: AutomationRuleCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = AutomationService(session)
    return await service.create_rule(
        project_id, body.model_dump(), created_by=user_id
    )


# ── Direct automation rule routes ────────────────────────────────


@router.get(
    "/automations/{rule_id}",
    response_model=AutomationRuleResponse,
)
async def get_automation(
    rule_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = AutomationService(session)
    return await service.get_rule(rule_id)


@router.patch(
    "/automations/{rule_id}",
    response_model=AutomationRuleResponse,
)
async def update_automation(
    rule_id: UUID,
    body: AutomationRuleUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = AutomationService(session)
    return await service.update_rule(
        rule_id, body.model_dump(exclude_unset=True), updated_by=user_id
    )


@router.delete(
    "/automations/{rule_id}",
    response_model=MessageResponse,
)
async def delete_automation(
    rule_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = AutomationService(session)
    await service.delete_rule(rule_id)
    return MessageResponse(message="Automation rule deleted")


# ── Test (dry-run) ───────────────────────────────────────────────


@router.post(
    "/automations/{rule_id}/test",
    response_model=AutomationTestResponse,
)
async def test_automation(
    rule_id: UUID,
    body: AutomationTestRequest,
    session: AsyncSession = Depends(get_db),
):
    service = AutomationService(session)
    return await service.test_rule(rule_id, body.issue_id)


# ── Execution logs ───────────────────────────────────────────────


@router.get(
    "/automations/{rule_id}/logs",
    response_model=CursorPage[AutomationExecutionLogResponse],
)
async def list_automation_logs(
    rule_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = AutomationService(session)
    result = await service.get_execution_log(
        rule_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)
