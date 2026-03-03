from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.baseline import (
    BaselineCompareResponse,
    BaselineCreate,
    BaselineDetailResponse,
    BaselineResponse,
)
from app.services.baseline import BaselineService

router = APIRouter(tags=["baselines"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Scoped under projects ──────────────────────────────────────


@router.get(
    "/projects/{project_id}/baselines",
    response_model=CursorPage[BaselineResponse],
)
async def list_baselines(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = BaselineService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/baselines",
    response_model=BaselineDetailResponse,
    status_code=201,
)
async def create_baseline(
    project_id: UUID,
    body: BaselineCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = BaselineService(session)
    data = body.model_dump()
    return await service.create_baseline(project_id, data, user_id=user_id)


# ── Direct baseline routes ──────────────────────────────────────


@router.get(
    "/baselines/{baseline_id}",
    response_model=BaselineDetailResponse,
)
async def get_baseline(
    baseline_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = BaselineService(session)
    return await service.get_baseline(baseline_id)


@router.get(
    "/baselines/{baseline_id}/compare",
    response_model=BaselineCompareResponse,
)
async def compare_baseline(
    baseline_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = BaselineService(session)
    return await service.compare(baseline_id)


@router.delete(
    "/baselines/{baseline_id}",
    response_model=MessageResponse,
)
async def delete_baseline(
    baseline_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = BaselineService(session)
    await service.delete_baseline(baseline_id, deleted_by=user_id)
    return MessageResponse(message="Baseline deleted")
