from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_extras import (
    ComponentCreate,
    ComponentResponse,
    ComponentUpdate,
)
from app.services.issue_extras import ComponentService

router = APIRouter(tags=["components"])


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
    "/projects/{project_id}/components",
    response_model=CursorPage[ComponentResponse],
)
async def list_components(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = ComponentService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/components",
    response_model=ComponentResponse,
    status_code=201,
)
async def create_component(
    project_id: UUID,
    body: ComponentCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ComponentService(session)
    data = body.model_dump()
    return await service.create_component(project_id, data, created_by=user_id)


# ── Direct component routes ─────────────────────────────────────


@router.get("/components/{component_id}", response_model=ComponentResponse)
async def get_component(
    component_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = ComponentService(session)
    return await service.get_component(component_id)


@router.put("/components/{component_id}", response_model=ComponentResponse)
async def update_component(
    component_id: UUID,
    body: ComponentUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ComponentService(session)
    data = body.model_dump(exclude_unset=True)
    return await service.update_component(
        component_id, data, updated_by=user_id
    )


@router.delete("/components/{component_id}", response_model=MessageResponse)
async def delete_component(
    component_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = ComponentService(session)
    await service.delete_component(component_id)
    return MessageResponse(message="Component deleted")
