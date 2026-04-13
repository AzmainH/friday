"""AI Re-forecasting Engine endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.reforecast import CriticalPath, ReforecastResult, VarianceAlert
from app.services.reforecast import ReforecastService

router = APIRouter(tags=["reforecast"], prefix="/projects")


# -- Request bodies --------------------------------------------------------


class ReforecastRequest(BaseModel):
    updated_task_ids: list[UUID]


# -- Endpoints -------------------------------------------------------------


@router.post(
    "/{project_id}/reforecast",
    response_model=ReforecastResult,
)
async def trigger_reforecast(
    project_id: UUID,
    body: ReforecastRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Propagate schedule changes from updated tasks to their downstream dependents."""
    service = ReforecastService(session)
    return await service.reforecast_from_update(project_id, body.updated_task_ids)


@router.get(
    "/{project_id}/critical-path",
    response_model=CriticalPath,
)
async def get_critical_path(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Calculate and return the critical path for a project."""
    service = ReforecastService(session)
    return await service.calculate_critical_path(project_id)


@router.get(
    "/{project_id}/variance-alerts",
    response_model=list[VarianceAlert],
)
async def get_variance_alerts(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Detect and return variance alerts for a project."""
    service = ReforecastService(session)
    return await service.detect_variance_alerts(project_id)
