from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_extras import LabelCreate, LabelResponse
from app.services.issue_extras import LabelService

router = APIRouter(tags=["labels"])


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
    "/projects/{project_id}/labels",
    response_model=CursorPage[LabelResponse],
)
async def list_labels(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = LabelService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/labels",
    response_model=LabelResponse,
    status_code=201,
)
async def create_label(
    project_id: UUID,
    body: LabelCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = LabelService(session)
    data = body.model_dump()
    return await service.create_label(project_id, data, created_by=user_id)


# ── Direct label routes ─────────────────────────────────────────


@router.delete("/labels/{label_id}", response_model=MessageResponse)
async def delete_label(
    label_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = LabelService(session)
    await service.delete_label(label_id)
    return MessageResponse(message="Label deleted")
