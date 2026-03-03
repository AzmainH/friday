from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.sla import (
    IssueSLAStatusResponse,
    SLAPolicyCreate,
    SLAPolicyResponse,
    SLAPolicyUpdate,
)
from app.services.sla import SLAService

router = APIRouter(tags=["sla"])


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
    "/projects/{project_id}/sla-policies",
    response_model=CursorPage[SLAPolicyResponse],
)
async def list_sla_policies(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = SLAService(session)
    result = await service.list_policies_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/sla-policies",
    response_model=SLAPolicyResponse,
    status_code=201,
)
async def create_sla_policy(
    project_id: UUID,
    body: SLAPolicyCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SLAService(session)
    data = body.model_dump()
    return await service.create_policy(project_id, data, created_by=user_id)


# ── Direct SLA policy routes ─────────────────────────────────


@router.patch("/sla-policies/{policy_id}", response_model=SLAPolicyResponse)
async def update_sla_policy(
    policy_id: UUID,
    body: SLAPolicyUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SLAService(session)
    return await service.update_policy(
        policy_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/sla-policies/{policy_id}", response_model=MessageResponse)
async def delete_sla_policy(
    policy_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SLAService(session)
    await service.delete_policy(policy_id)
    return MessageResponse(message="SLA policy deleted")


# ── Issue SLA status ──────────────────────────────────────────


@router.get(
    "/issues/{issue_id}/sla",
    response_model=IssueSLAStatusResponse | None,
)
async def get_issue_sla_status(
    issue_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = SLAService(session)
    return await service.get_status_for_issue(issue_id)
