from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_type import IssueTypeCreate, IssueTypeResponse, IssueTypeUpdate
from app.services.issue_type import IssueTypeService

router = APIRouter(tags=["issue-types"])


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
    "/projects/{project_id}/issue-types",
    response_model=CursorPage[IssueTypeResponse],
)
async def list_issue_types(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = IssueTypeService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/issue-types",
    response_model=IssueTypeResponse,
    status_code=201,
)
async def create_issue_type(
    project_id: UUID,
    body: IssueTypeCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IssueTypeService(session)
    data = body.model_dump()
    return await service.create_issue_type(project_id, data, created_by=user_id)


# ── Direct issue-type routes ────────────────────────────────────


@router.get("/issue-types/{issue_type_id}", response_model=IssueTypeResponse)
async def get_issue_type(
    issue_type_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = IssueTypeService(session)
    return await service.get_issue_type(issue_type_id)


@router.put("/issue-types/{issue_type_id}", response_model=IssueTypeResponse)
async def update_issue_type(
    issue_type_id: UUID,
    body: IssueTypeUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IssueTypeService(session)
    return await service.update_issue_type(
        issue_type_id, body.model_dump(exclude_unset=True), updated_by=user_id
    )


@router.delete("/issue-types/{issue_type_id}", response_model=MessageResponse)
async def delete_issue_type(
    issue_type_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IssueTypeService(session)
    await service.delete_issue_type(issue_type_id, deleted_by=user_id)
    return MessageResponse(message="Issue type deleted")
