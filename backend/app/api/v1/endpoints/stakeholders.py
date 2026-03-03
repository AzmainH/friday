from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.stakeholder import (
    StakeholderCreate,
    StakeholderMatrixResponse,
    StakeholderResponse,
    StakeholderUpdate,
)
from app.services.stakeholder import StakeholderService

router = APIRouter(tags=["stakeholders"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# -- Scoped under projects ---------------------------------------------------


@router.get(
    "/projects/{project_id}/stakeholders",
    response_model=CursorPage[StakeholderResponse],
)
async def list_stakeholders(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = StakeholderService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/stakeholders",
    response_model=StakeholderResponse,
    status_code=201,
)
async def create_stakeholder(
    project_id: UUID,
    body: StakeholderCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = StakeholderService(session)
    data = body.model_dump()
    return await service.create_stakeholder(project_id, data, created_by=user_id)


@router.get(
    "/projects/{project_id}/stakeholders/matrix",
    response_model=StakeholderMatrixResponse,
)
async def get_stakeholder_matrix(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = StakeholderService(session)
    entries = await service.get_matrix(project_id)
    return StakeholderMatrixResponse(data=entries)


# -- Direct stakeholder routes ------------------------------------------------


@router.get(
    "/stakeholders/{stakeholder_id}",
    response_model=StakeholderResponse,
)
async def get_stakeholder(
    stakeholder_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = StakeholderService(session)
    return await service.get_stakeholder(stakeholder_id)


@router.patch(
    "/stakeholders/{stakeholder_id}",
    response_model=StakeholderResponse,
)
async def update_stakeholder(
    stakeholder_id: UUID,
    body: StakeholderUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = StakeholderService(session)
    data = body.model_dump(exclude_unset=True)
    return await service.update_stakeholder(
        stakeholder_id, data, updated_by=user_id
    )


@router.delete(
    "/stakeholders/{stakeholder_id}",
    response_model=MessageResponse,
)
async def delete_stakeholder(
    stakeholder_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = StakeholderService(session)
    await service.delete_stakeholder(stakeholder_id, deleted_by=user_id)
    return MessageResponse(message="Stakeholder deleted")
