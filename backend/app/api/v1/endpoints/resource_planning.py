"""Resource capacity planning endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.resource_planning import (
    TeamAllocationResponse,
    TeamCapacityResponse,
    UtilizationResponse,
)
from app.services.resource_planning import ResourcePlanningService

router = APIRouter(tags=["resource-planning"])


@router.get(
    "/workspaces/{workspace_id}/resource-planning/capacity",
    response_model=TeamCapacityResponse,
)
async def get_team_capacity(
    workspace_id: UUID,
    weeks: int = Query(4, ge=1, le=52),
    session: AsyncSession = Depends(get_db),
):
    service = ResourcePlanningService(session)
    return await service.get_team_capacity(workspace_id, weeks)


@router.get(
    "/workspaces/{workspace_id}/resource-planning/allocation",
    response_model=TeamAllocationResponse,
)
async def get_team_allocation(
    workspace_id: UUID,
    weeks: int = Query(4, ge=1, le=52),
    session: AsyncSession = Depends(get_db),
):
    service = ResourcePlanningService(session)
    return await service.get_team_allocation(workspace_id, weeks)


@router.get(
    "/workspaces/{workspace_id}/resource-planning/utilization",
    response_model=UtilizationResponse,
)
async def get_utilization_report(
    workspace_id: UUID,
    weeks: int = Query(4, ge=1, le=52),
    session: AsyncSession = Depends(get_db),
):
    service = ResourcePlanningService(session)
    return await service.get_utilization_report(workspace_id, weeks)
