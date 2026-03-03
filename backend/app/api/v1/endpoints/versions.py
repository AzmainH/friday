from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_extras import VersionCreate, VersionResponse, VersionUpdate
from app.services.issue_extras import VersionService

router = APIRouter(tags=["versions"])


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
    "/projects/{project_id}/versions",
    response_model=CursorPage[VersionResponse],
)
async def list_versions(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = VersionService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/versions",
    response_model=VersionResponse,
    status_code=201,
)
async def create_version(
    project_id: UUID,
    body: VersionCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = VersionService(session)
    data = body.model_dump()
    return await service.create_version(project_id, data, created_by=user_id)


# ── Direct version routes ───────────────────────────────────────


@router.get("/versions/{version_id}", response_model=VersionResponse)
async def get_version(
    version_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = VersionService(session)
    return await service.get_version(version_id)


@router.put("/versions/{version_id}", response_model=VersionResponse)
async def update_version(
    version_id: UUID,
    body: VersionUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = VersionService(session)
    return await service.update_version(
        version_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/versions/{version_id}", response_model=MessageResponse)
async def delete_version(
    version_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = VersionService(session)
    await service.delete_version(version_id)
    return MessageResponse(message="Version deleted")
