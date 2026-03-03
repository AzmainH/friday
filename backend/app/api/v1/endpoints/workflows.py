from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowDetailResponse,
    WorkflowResponse,
    WorkflowStatusCreate,
    WorkflowStatusResponse,
    WorkflowTransitionCreate,
    WorkflowTransitionResponse,
    WorkflowUpdate,
)
from app.services.workflow import WorkflowService

router = APIRouter(tags=["workflows"])


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
    "/projects/{project_id}/workflows",
    response_model=CursorPage[WorkflowResponse],
)
async def list_workflows(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = WorkflowService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/workflows",
    response_model=WorkflowResponse,
    status_code=201,
)
async def create_workflow(
    project_id: UUID,
    body: WorkflowCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WorkflowService(session)
    return await service.create_workflow(
        project_id, body.model_dump(), created_by=user_id
    )


# ── Direct workflow routes ──────────────────────────────────────


@router.get(
    "/workflows/{workflow_id}", response_model=WorkflowDetailResponse
)
async def get_workflow(
    workflow_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = WorkflowService(session)
    return await service.get_workflow_detail(workflow_id)


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: UUID,
    body: WorkflowUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WorkflowService(session)
    return await service.update_workflow(
        workflow_id, body.model_dump(exclude_unset=True), updated_by=user_id
    )


@router.delete("/workflows/{workflow_id}", response_model=MessageResponse)
async def delete_workflow(
    workflow_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = WorkflowService(session)
    await service.delete_workflow(workflow_id)
    return MessageResponse(message="Workflow deleted")


# ── Workflow statuses ───────────────────────────────────────────


@router.post(
    "/workflows/{workflow_id}/statuses",
    response_model=WorkflowStatusResponse,
    status_code=201,
)
async def add_workflow_status(
    workflow_id: UUID,
    body: WorkflowStatusCreate,
    session: AsyncSession = Depends(get_db),
):
    service = WorkflowService(session)
    return await service.create_status(workflow_id, body.model_dump())


# ── Workflow transitions ────────────────────────────────────────


@router.post(
    "/workflows/{workflow_id}/transitions",
    response_model=WorkflowTransitionResponse,
    status_code=201,
)
async def add_workflow_transition(
    workflow_id: UUID,
    body: WorkflowTransitionCreate,
    session: AsyncSession = Depends(get_db),
):
    service = WorkflowService(session)
    return await service.create_transition(workflow_id, body.model_dump())


@router.get(
    "/workflows/{workflow_id}/transitions",
    response_model=list[WorkflowTransitionResponse],
)
async def list_workflow_transitions(
    workflow_id: UUID,
    from_status_id: UUID = Query(...),
    session: AsyncSession = Depends(get_db),
):
    service = WorkflowService(session)
    return await service.list_transitions(workflow_id, from_status_id)
