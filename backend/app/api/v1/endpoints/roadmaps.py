from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db, resolve_workspace_id
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.roadmap import (
    RoadmapPlanCreate,
    RoadmapPlanProjectCreate,
    RoadmapPlanProjectResponse,
    RoadmapPlanResponse,
    RoadmapPlanUpdate,
    RoadmapScenarioCreate,
    RoadmapScenarioResponse,
    RoadmapTimelineResponse,
)
from app.services.roadmap import RoadmapService

router = APIRouter(tags=["roadmaps"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Scoped under workspaces ─────────────────────────────────────


@router.get(
    "/workspaces/{workspace_id}/roadmaps",
    response_model=CursorPage[RoadmapPlanResponse],
)
async def list_plans(
    workspace_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = RoadmapService(session)
    result = await service.list_plans(
        workspace_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.get(
    "/roadmaps",
    response_model=CursorPage[RoadmapPlanResponse],
)
async def list_plans_query(
    workspace_id: str = Query(..., alias="workspace_id"),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    """Alias for frontend: GET /roadmaps?workspace_id=default"""
    resolved = await resolve_workspace_id(workspace_id, session)
    if not resolved:
        return _build_page({"data": [], "next_cursor": None, "has_more": False, "total_count": 0})
    service = RoadmapService(session)
    result = await service.list_plans(
        resolved,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/workspaces/{workspace_id}/roadmaps",
    response_model=RoadmapPlanResponse,
    status_code=201,
)
async def create_plan(
    workspace_id: UUID,
    body: RoadmapPlanCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RoadmapService(session)
    data = body.model_dump()
    data["workspace_id"] = workspace_id
    return await service.create_plan(data, created_by=user_id)


# ── Direct plan routes ──────────────────────────────────────────


@router.get("/roadmaps/{plan_id}", response_model=RoadmapPlanResponse)
async def get_plan(
    plan_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RoadmapService(session)
    return await service.get_plan(plan_id)


@router.patch("/roadmaps/{plan_id}", response_model=RoadmapPlanResponse)
async def update_plan(
    plan_id: UUID,
    body: RoadmapPlanUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RoadmapService(session)
    return await service.update_plan(
        plan_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/roadmaps/{plan_id}", response_model=MessageResponse)
async def delete_plan(
    plan_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RoadmapService(session)
    await service.delete_plan(plan_id)
    return MessageResponse(message="Roadmap plan deleted")


# ── Plan projects ───────────────────────────────────────────────


@router.post(
    "/roadmaps/{plan_id}/projects",
    response_model=RoadmapPlanProjectResponse,
    status_code=201,
)
async def add_project(
    plan_id: UUID,
    body: RoadmapPlanProjectCreate,
    session: AsyncSession = Depends(get_db),
):
    service = RoadmapService(session)
    data = body.model_dump()
    return await service.add_project(plan_id, data)


@router.delete(
    "/roadmaps/{plan_id}/projects/{project_id}",
    response_model=MessageResponse,
)
async def remove_project(
    plan_id: UUID,
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RoadmapService(session)
    await service.remove_project(plan_id, project_id)
    return MessageResponse(message="Project removed from roadmap plan")


# ── Timeline ────────────────────────────────────────────────────


@router.get(
    "/roadmaps/{plan_id}/timeline",
    response_model=RoadmapTimelineResponse,
)
async def get_timeline(
    plan_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RoadmapService(session)
    items = await service.get_timeline(plan_id)
    return RoadmapTimelineResponse(items=items)


# ── Scenarios ───────────────────────────────────────────────────


@router.get(
    "/roadmaps/{plan_id}/scenarios",
    response_model=CursorPage[RoadmapScenarioResponse],
)
async def list_scenarios(
    plan_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = RoadmapService(session)
    result = await service.list_scenarios(
        plan_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/roadmaps/{plan_id}/scenarios",
    response_model=RoadmapScenarioResponse,
    status_code=201,
)
async def create_scenario(
    plan_id: UUID,
    body: RoadmapScenarioCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RoadmapService(session)
    data = body.model_dump()
    return await service.create_scenario(plan_id, data, created_by=user_id)
