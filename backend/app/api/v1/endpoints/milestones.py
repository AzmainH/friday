from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.milestone import (
    GateApprovalCreate,
    GateApprovalDecision,
    GateApprovalResponse,
    MilestoneCreate,
    MilestoneResponse,
    MilestoneUpdate,
)
from app.services.milestone import MilestoneService

router = APIRouter(tags=["milestones"])


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
    "/projects/{project_id}/milestones",
    response_model=CursorPage[MilestoneResponse],
)
async def list_milestones(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = MilestoneService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/milestones",
    response_model=MilestoneResponse,
    status_code=201,
)
async def create_milestone(
    project_id: UUID,
    body: MilestoneCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = MilestoneService(session)
    data = body.model_dump()
    return await service.create_milestone(project_id, data, created_by=user_id)


# ── Direct milestone routes ────────────────────────────────────


@router.get("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def get_milestone(
    milestone_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = MilestoneService(session)
    return await service.get_milestone(milestone_id)


@router.patch("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: UUID,
    body: MilestoneUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = MilestoneService(session)
    return await service.update_milestone(
        milestone_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/milestones/{milestone_id}", response_model=MessageResponse)
async def delete_milestone(
    milestone_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = MilestoneService(session)
    await service.delete_milestone(milestone_id, deleted_by=user_id)
    return MessageResponse(message="Milestone deleted")


# ── Gate approvals ──────────────────────────────────────────────


@router.post(
    "/milestones/{milestone_id}/gate-approvals",
    response_model=GateApprovalResponse,
    status_code=201,
)
async def request_gate_approval(
    milestone_id: UUID,
    body: GateApprovalCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = MilestoneService(session)
    return await service.request_gate_approval(
        milestone_id,
        approver_id=user_id,
        notes=body.notes,
    )


@router.patch(
    "/gate-approvals/{approval_id}",
    response_model=GateApprovalResponse,
)
async def decide_gate_approval(
    approval_id: UUID,
    body: GateApprovalDecision,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = MilestoneService(session)
    return await service.decide_gate(
        approval_id,
        body.status,
        notes=body.notes,
    )
