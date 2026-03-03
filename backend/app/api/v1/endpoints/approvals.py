from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.approval import (
    ApprovalStepCreate,
    ApprovalStepResponse,
    ApprovalStepUpdate,
    IssueApprovalDecision,
    IssueApprovalResponse,
)
from app.services.approval import ApprovalService

router = APIRouter(tags=["approvals"])


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
    "/projects/{project_id}/approval-steps",
    response_model=CursorPage[ApprovalStepResponse],
)
async def list_approval_steps(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = ApprovalService(session)
    result = await service.list_steps_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/approval-steps",
    response_model=ApprovalStepResponse,
    status_code=201,
)
async def create_approval_step(
    project_id: UUID,
    body: ApprovalStepCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ApprovalService(session)
    data = body.model_dump()
    return await service.create_step(project_id, data, created_by=user_id)


# ── Direct approval-step routes ─────────────────────────────────


@router.patch(
    "/approval-steps/{step_id}",
    response_model=ApprovalStepResponse,
)
async def update_approval_step(
    step_id: UUID,
    body: ApprovalStepUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ApprovalService(session)
    return await service.update_step(
        step_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete(
    "/approval-steps/{step_id}",
    response_model=MessageResponse,
)
async def delete_approval_step(
    step_id: UUID,
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = ApprovalService(session)
    await service.delete_step(step_id)
    return MessageResponse(message="Approval step deleted")


# ── Issue approvals ─────────────────────────────────────────────


@router.post(
    "/issues/{issue_id}/approvals/request",
    response_model=list[IssueApprovalResponse],
    status_code=201,
)
async def request_issue_approval(
    issue_id: UUID,
    project_id: UUID = Query(..., description="Project ID to look up approval steps"),
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = ApprovalService(session)
    return await service.request_approval(issue_id, project_id)


@router.patch(
    "/issue-approvals/{approval_id}",
    response_model=IssueApprovalResponse,
)
async def decide_issue_approval(
    approval_id: UUID,
    body: IssueApprovalDecision,
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = ApprovalService(session)
    return await service.decide_approval(
        approval_id,
        body.status,
        notes=body.notes,
    )


@router.get(
    "/issues/{issue_id}/approvals",
    response_model=CursorPage[IssueApprovalResponse],
)
async def list_issue_approvals(
    issue_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = ApprovalService(session)
    result = await service.list_approvals_for_issue(
        issue_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)
