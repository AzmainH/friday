from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_extras import (
    SavedViewCreate,
    SavedViewResponse,
    SavedViewUpdate,
)
from app.services.issue_extras import SavedViewService

router = APIRouter(tags=["saved-views"])


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
    "/projects/{project_id}/saved-views",
    response_model=CursorPage[SavedViewResponse],
)
async def list_saved_views(
    project_id: UUID,
    shared: bool = Query(False),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SavedViewService(session)
    if shared:
        result = await service.list_shared(
            project_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )
    else:
        result = await service.list_by_project_and_user(
            project_id,
            user_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/saved-views",
    response_model=SavedViewResponse,
    status_code=201,
)
async def create_saved_view(
    project_id: UUID,
    body: SavedViewCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = SavedViewService(session)
    data = body.model_dump()
    return await service.create_saved_view(project_id, user_id, data)


# ── Direct saved-view routes ────────────────────────────────────


@router.get("/saved-views/{view_id}", response_model=SavedViewResponse)
async def get_saved_view(
    view_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = SavedViewService(session)
    return await service.get_saved_view(view_id)


@router.put("/saved-views/{view_id}", response_model=SavedViewResponse)
async def update_saved_view(
    view_id: UUID,
    body: SavedViewUpdate,
    session: AsyncSession = Depends(get_db),
):
    service = SavedViewService(session)
    return await service.update_saved_view(
        view_id,
        body.model_dump(exclude_unset=True),
    )


@router.delete("/saved-views/{view_id}", response_model=MessageResponse)
async def delete_saved_view(
    view_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = SavedViewService(session)
    await service.delete_saved_view(view_id)
    return MessageResponse(message="Saved view deleted")
