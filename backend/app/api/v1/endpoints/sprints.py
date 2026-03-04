from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue import IssueResponse
from app.schemas.sprint import (
    SprintAddIssuesRequest,
    SprintBurndownResponse,
    SprintCreate,
    SprintResponse,
    SprintUpdate,
)
from app.services.sprint import SprintService

router = APIRouter(tags=["sprints"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# -- Scoped under projects ------------------------------------------------


@router.get(
    "/projects/{project_id}/sprints",
    response_model=CursorPage[SprintResponse],
)
async def list_sprints(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    status: str | None = Query(None),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = SprintService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        status=status,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/sprints",
    response_model=SprintResponse,
    status_code=201,
)
async def create_sprint(
    project_id: UUID,
    body: SprintCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SprintService(session)
    data = body.model_dump()
    return await service.create_sprint(project_id, data, created_by=user_id)


# -- Direct sprint routes --------------------------------------------------


@router.get("/sprints/{sprint_id}", response_model=SprintResponse)
async def get_sprint(
    sprint_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = SprintService(session)
    return await service.get_sprint(sprint_id)


@router.patch("/sprints/{sprint_id}", response_model=SprintResponse)
async def update_sprint(
    sprint_id: UUID,
    body: SprintUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SprintService(session)
    return await service.update_sprint(
        sprint_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/sprints/{sprint_id}", response_model=MessageResponse)
async def delete_sprint(
    sprint_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SprintService(session)
    await service.delete_sprint(sprint_id, deleted_by=user_id)
    return MessageResponse(message="Sprint deleted")


# -- Sprint lifecycle -------------------------------------------------------


@router.post("/sprints/{sprint_id}/start", response_model=SprintResponse)
async def start_sprint(
    sprint_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SprintService(session)
    return await service.start_sprint(sprint_id, updated_by=user_id)


@router.post("/sprints/{sprint_id}/complete", response_model=SprintResponse)
async def complete_sprint(
    sprint_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SprintService(session)
    return await service.complete_sprint(sprint_id, updated_by=user_id)


# -- Burndown ---------------------------------------------------------------


@router.get(
    "/sprints/{sprint_id}/burndown",
    response_model=SprintBurndownResponse,
)
async def get_sprint_burndown(
    sprint_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = SprintService(session)
    return await service.get_sprint_burndown(sprint_id)


# -- Sprint issues ----------------------------------------------------------


@router.post(
    "/sprints/{sprint_id}/issues",
    response_model=list[IssueResponse],
)
async def add_issues_to_sprint(
    sprint_id: UUID,
    body: SprintAddIssuesRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SprintService(session)
    return await service.add_issues_to_sprint(
        sprint_id, body.issue_ids, updated_by=user_id
    )


@router.delete(
    "/sprints/{sprint_id}/issues/{issue_id}",
    response_model=MessageResponse,
)
async def remove_issue_from_sprint(
    sprint_id: UUID,
    issue_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SprintService(session)
    await service.remove_issue_from_sprint(
        sprint_id, issue_id, updated_by=user_id
    )
    return MessageResponse(message="Issue removed from sprint")
