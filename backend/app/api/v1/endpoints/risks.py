from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.risk import (
    RiskCreate,
    RiskMatrixCell,
    RiskMatrixResponse,
    RiskRead,
    RiskResponseCreate,
    RiskResponseRead,
    RiskResponseUpdate,
    RiskSummaryResponse,
    RiskUpdate,
)
from app.services.risk import RiskService

router = APIRouter(tags=["risks"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# -- Scoped under projects ----------------------------------------------------


@router.get(
    "/projects/{project_id}/risks",
    response_model=CursorPage[RiskRead],
)
async def list_risks(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = RiskService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/risks",
    response_model=RiskRead,
    status_code=201,
)
async def create_risk(
    project_id: UUID,
    body: RiskCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RiskService(session)
    data = body.model_dump()
    return await service.create_risk(project_id, data, created_by=user_id)


@router.get(
    "/projects/{project_id}/risks/matrix",
    response_model=RiskMatrixResponse,
)
async def get_risk_matrix(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RiskService(session)
    cells = await service.get_risk_matrix(project_id)
    return RiskMatrixResponse(
        cells=[RiskMatrixCell(**c) for c in cells]
    )


@router.get(
    "/projects/{project_id}/risks/summary",
    response_model=RiskSummaryResponse,
)
async def get_risk_summary(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RiskService(session)
    return await service.get_risk_summary(project_id)


# -- Direct risk routes --------------------------------------------------------


@router.get("/risks/{risk_id}", response_model=RiskRead)
async def get_risk(
    risk_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RiskService(session)
    return await service.get_risk(risk_id)


@router.patch("/risks/{risk_id}", response_model=RiskRead)
async def update_risk(
    risk_id: UUID,
    body: RiskUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RiskService(session)
    data = body.model_dump(exclude_unset=True)
    return await service.update_risk(risk_id, data, updated_by=user_id)


@router.delete("/risks/{risk_id}", response_model=MessageResponse)
async def delete_risk(
    risk_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RiskService(session)
    await service.delete_risk(risk_id, deleted_by=user_id)
    return MessageResponse(message="Risk deleted")


# -- Risk responses (actions) --------------------------------------------------


@router.get(
    "/risks/{risk_id}/responses",
    response_model=CursorPage[RiskResponseRead],
)
async def list_risk_responses(
    risk_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = RiskService(session)
    result = await service.list_responses(
        risk_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/risks/{risk_id}/responses",
    response_model=RiskResponseRead,
    status_code=201,
)
async def create_risk_response(
    risk_id: UUID,
    body: RiskResponseCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RiskService(session)
    data = body.model_dump()
    return await service.create_response(risk_id, data, created_by=user_id)


@router.patch(
    "/risk-responses/{response_id}",
    response_model=RiskResponseRead,
)
async def update_risk_response(
    response_id: UUID,
    body: RiskResponseUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RiskService(session)
    data = body.model_dump(exclude_unset=True)
    return await service.update_response(
        response_id, data, updated_by=user_id
    )


@router.delete(
    "/risk-responses/{response_id}",
    response_model=MessageResponse,
)
async def delete_risk_response(
    response_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RiskService(session)
    await service.delete_response(response_id, deleted_by=user_id)
    return MessageResponse(message="Risk response deleted")
