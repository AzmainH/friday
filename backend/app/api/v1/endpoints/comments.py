from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.core.errors import NotFoundException
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_relation import (
    IssueCommentCreate,
    IssueCommentResponse,
    IssueCommentUpdate,
)
from app.repositories.issue_relation import IssueCommentRepository

router = APIRouter(tags=["comments"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


@router.get(
    "/issues/{issue_id}/comments",
    response_model=CursorPage[IssueCommentResponse],
)
async def list_comments(
    issue_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    repo = IssueCommentRepository(session)
    result = await repo.get_by_issue(
        issue_id, cursor=cursor, limit=limit, include_count=include_count
    )
    return _build_page(result)


@router.post(
    "/issues/{issue_id}/comments",
    response_model=IssueCommentResponse,
    status_code=201,
)
async def create_comment(
    issue_id: UUID,
    body: IssueCommentCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    repo = IssueCommentRepository(session)
    data = body.model_dump()
    data["issue_id"] = issue_id
    data["user_id"] = user_id
    return await repo.create(data)


@router.put("/comments/{comment_id}", response_model=IssueCommentResponse)
async def update_comment(
    comment_id: UUID,
    body: IssueCommentUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    repo = IssueCommentRepository(session)
    updated = await repo.update(comment_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise NotFoundException("Comment not found")
    return updated


@router.delete("/comments/{comment_id}", response_model=MessageResponse)
async def delete_comment(
    comment_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    repo = IssueCommentRepository(session)
    deleted = await repo.hard_delete(comment_id)
    if not deleted:
        raise NotFoundException("Comment not found")
    return MessageResponse(message="Comment deleted")
