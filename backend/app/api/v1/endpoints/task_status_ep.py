from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, PaginationMeta
from app.schemas.issue_extras import TaskStatusResponse
from app.services.issue_extras import TaskStatusService

router = APIRouter(tags=["task-status"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


@router.get("/me/tasks", response_model=CursorPage[TaskStatusResponse])
async def list_my_tasks(
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = TaskStatusService(session)
    result = await service.list_by_user(
        user_id, cursor=cursor, limit=limit, include_count=include_count
    )
    return _build_page(result)


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = TaskStatusService(session)
    return await service.get_task_status(task_id)
