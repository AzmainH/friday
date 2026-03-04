from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from redis.asyncio import Redis

from app.core.deps import get_current_user_id, get_db, get_redis
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue import (
    IssueBulkResponse,
    IssueBulkUpdateRequest,
    IssueCreate,
    IssueResponse,
    IssueUpdate,
)
from app.services.issue import IssueService

router = APIRouter(tags=["issues"])


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
    "/projects/{project_id}/issues",
    response_model=CursorPage[IssueResponse],
)
async def list_issues(
    project_id: UUID,
    status_id: UUID | None = Query(None),
    issue_type_id: UUID | None = Query(None),
    assignee_id: UUID | None = Query(None),
    priority: str | None = Query(None),
    milestone_id: UUID | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    include_count: bool = Query(False),
    sort_by: str | None = Query(None),
    sort_order: str | None = Query(None),
    search: str | None = Query(None),
    session: AsyncSession = Depends(get_db),
):
    service = IssueService(session)
    result = await service.list_issues(
        project_id,
        status_id=status_id,
        issue_type_id=issue_type_id,
        assignee_id=assignee_id,
        priority=priority,
        milestone_id=milestone_id,
        search_text=search,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/issues",
    response_model=IssueResponse,
    status_code=201,
)
async def create_issue(
    project_id: UUID,
    body: IssueCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    redis: Redis = Depends(get_redis),
):
    service = IssueService(session, redis=redis)
    data = body.model_dump()
    return await service.create_issue(
        project_id, data, reporter_id=user_id, created_by=user_id
    )


@router.post(
    "/projects/{project_id}/issues/bulk",
    response_model=IssueBulkResponse,
    status_code=201,
)
async def bulk_update_issues(
    project_id: UUID,
    body: IssueBulkUpdateRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IssueService(session)
    count, errors = await service.bulk_update(
        body.issue_ids,
        body.update.model_dump(exclude_unset=True),
        updated_by=user_id,
    )
    return IssueBulkResponse(updated_count=count, errors=errors or None)


@router.get(
    "/projects/{project_id}/issues/search",
    response_model=list[IssueResponse],
)
async def search_issues(
    project_id: UUID,
    q: str = Query(...),
    session: AsyncSession = Depends(get_db),
):
    service = IssueService(session)
    return await service.search_issues(project_id, q)


# ── Direct issue routes ─────────────────────────────────────────


@router.get("/issues/{issue_id}", response_model=IssueResponse)
async def get_issue(
    issue_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = IssueService(session)
    return await service.get_issue(issue_id)


@router.put("/issues/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: UUID,
    body: IssueUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    redis: Redis = Depends(get_redis),
):
    service = IssueService(session, redis=redis)
    return await service.update_issue(
        issue_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/issues/{issue_id}", response_model=MessageResponse)
async def delete_issue(
    issue_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    redis: Redis = Depends(get_redis),
):
    service = IssueService(session, redis=redis)
    await service.delete_issue(issue_id, deleted_by=user_id)
    return MessageResponse(message="Issue deleted")
