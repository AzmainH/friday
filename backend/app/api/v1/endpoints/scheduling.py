from uuid import UUID

from arq.connections import ArqRedis, create_pool
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import MessageResponse
from app.schemas.schedule import ScheduleRunResponse, ScheduleTriggerResponse
from app.services.scheduling import SchedulingService
from app.worker import get_redis_settings

router = APIRouter(tags=["scheduling"])


async def _get_arq_pool(request: Request) -> ArqRedis:
    """Get or create an ARQ Redis pool from the app state."""
    if not hasattr(request.app.state, "arq_pool") or request.app.state.arq_pool is None:
        request.app.state.arq_pool = await create_pool(get_redis_settings())
    return request.app.state.arq_pool


@router.post(
    "/projects/{project_id}/schedule",
    response_model=ScheduleTriggerResponse,
    status_code=201,
)
async def trigger_schedule(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    arq_pool: ArqRedis = Depends(_get_arq_pool),
):
    """Trigger an auto-schedule run for all issues in a project."""
    service = SchedulingService(session)
    run_id = await service.trigger_schedule(project_id, user_id, arq_pool)
    return ScheduleTriggerResponse(
        run_id=run_id,
        message="Auto-schedule run has been queued",
    )


@router.get(
    "/projects/{project_id}/schedule/runs",
    response_model=list[ScheduleRunResponse],
)
async def list_schedule_runs(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """List all schedule runs for a project, most recent first."""
    service = SchedulingService(session)
    return await service.list_runs(project_id)


@router.get(
    "/schedule/runs/{run_id}",
    response_model=ScheduleRunResponse,
)
async def get_schedule_run(
    run_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """Get a single schedule run with its results."""
    service = SchedulingService(session)
    return await service.get_run(run_id)
