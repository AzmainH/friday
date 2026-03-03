from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_extras import TimeEntryCreate, TimeEntryResponse
from app.services.issue_extras import TimeEntryService

router = APIRouter(tags=["time-entries"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Scoped under issues ─────────────────────────────────────────


@router.get(
    "/issues/{issue_id}/time-entries",
    response_model=CursorPage[TimeEntryResponse],
)
async def list_time_entries(
    issue_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = TimeEntryService(session)
    result = await service.list_by_issue(
        issue_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/issues/{issue_id}/time-entries",
    response_model=TimeEntryResponse,
    status_code=201,
)
async def create_time_entry(
    issue_id: UUID,
    body: TimeEntryCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = TimeEntryService(session)
    data = body.model_dump()
    return await service.create_time_entry(issue_id, user_id, data)


# ── Direct time-entry routes ────────────────────────────────────


@router.delete("/time-entries/{entry_id}", response_model=MessageResponse)
async def delete_time_entry(
    entry_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = TimeEntryService(session)
    await service.delete_time_entry(entry_id)
    return MessageResponse(message="Time entry deleted")
