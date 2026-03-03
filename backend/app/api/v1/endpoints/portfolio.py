from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db, resolve_workspace_id
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.portfolio import (
    CrossProjectDependencyCreate,
    CrossProjectDependencyResponse,
    ImpactAnalysisResponse,
    PortfolioOverviewResponse,
    ReleaseCreate,
    ReleaseProjectCreate,
    ReleaseProjectResponse,
    ReleaseResponse,
    ReleaseUpdate,
)
from app.services.portfolio import (
    DependencyService,
    PortfolioService,
    ReleaseService,
)

router = APIRouter(tags=["portfolio"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Portfolio overview ──────────────────────────────────────────


@router.get(
    "/workspaces/{workspace_id}/portfolio",
    response_model=PortfolioOverviewResponse,
)
async def get_portfolio_overview(
    workspace_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = PortfolioService(session)
    return await service.get_overview(workspace_id)


@router.get(
    "/portfolio/overview",
    response_model=PortfolioOverviewResponse,
)
async def get_portfolio_overview_query(
    workspace_id: str = Query(..., alias="workspace_id"),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Alias for frontend: GET /portfolio/overview?workspace_id=default"""
    resolved = await resolve_workspace_id(workspace_id, session)
    if not resolved:
        return PortfolioOverviewResponse(projects=[], total_budget=0.0, total_spent=0.0)
    service = PortfolioService(session)
    return await service.get_overview(resolved)


# ── Releases scoped under workspaces ────────────────────────────


@router.get(
    "/workspaces/{workspace_id}/releases",
    response_model=CursorPage[ReleaseResponse],
)
async def list_releases(
    workspace_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReleaseService(session)
    result = await service.list_by_workspace(
        workspace_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.get(
    "/releases",
    response_model=CursorPage[ReleaseResponse],
)
async def list_releases_query(
    workspace_id: str = Query(..., alias="workspace_id"),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Alias for frontend: GET /releases?workspace_id=default"""
    resolved = await resolve_workspace_id(workspace_id, session)
    if not resolved:
        return _build_page({"data": [], "next_cursor": None, "has_more": False, "total_count": 0})
    service = ReleaseService(session)
    result = await service.list_by_workspace(
        resolved,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/workspaces/{workspace_id}/releases",
    response_model=ReleaseResponse,
    status_code=201,
)
async def create_release(
    workspace_id: UUID,
    body: ReleaseCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReleaseService(session)
    data = body.model_dump()
    return await service.create_release(workspace_id, data, created_by=user_id)


# ── Direct release routes ──────────────────────────────────────


@router.get("/releases/{release_id}", response_model=ReleaseResponse)
async def get_release(
    release_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReleaseService(session)
    return await service.get_release(release_id)


@router.patch("/releases/{release_id}", response_model=ReleaseResponse)
async def update_release(
    release_id: UUID,
    body: ReleaseUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReleaseService(session)
    return await service.update_release(
        release_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/releases/{release_id}", response_model=MessageResponse)
async def delete_release(
    release_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReleaseService(session)
    await service.delete_release(release_id)
    return MessageResponse(message="Release deleted")


# ── Release projects ───────────────────────────────────────────


@router.post(
    "/releases/{release_id}/projects",
    response_model=ReleaseProjectResponse,
    status_code=201,
)
async def add_release_project(
    release_id: UUID,
    body: ReleaseProjectCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReleaseService(session)
    return await service.add_project(release_id, body.project_id)


@router.delete(
    "/releases/{release_id}/projects",
    response_model=MessageResponse,
)
async def remove_release_project(
    release_id: UUID,
    body: ReleaseProjectCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReleaseService(session)
    await service.remove_project(release_id, body.project_id)
    return MessageResponse(message="Project removed from release")


# ── Cross-project dependencies scoped under workspaces ──────────


@router.get(
    "/workspaces/{workspace_id}/dependencies",
    response_model=CursorPage[CrossProjectDependencyResponse],
)
async def list_dependencies(
    workspace_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DependencyService(session)
    result = await service.list_by_workspace(
        workspace_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.get(
    "/portfolio/dependencies",
    response_model=CursorPage[CrossProjectDependencyResponse],
)
async def list_dependencies_query(
    workspace_id: str = Query(..., alias="workspace_id"),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Alias for frontend: GET /portfolio/dependencies?workspace_id=default"""
    resolved = await resolve_workspace_id(workspace_id, session)
    if not resolved:
        return _build_page({"data": [], "next_cursor": None, "has_more": False, "total_count": 0})
    service = DependencyService(session)
    result = await service.list_by_workspace(
        resolved,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/workspaces/{workspace_id}/dependencies",
    response_model=CrossProjectDependencyResponse,
    status_code=201,
)
async def create_dependency(
    workspace_id: UUID,
    body: CrossProjectDependencyCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DependencyService(session)
    data = body.model_dump()
    return await service.create_dependency(data, created_by=user_id)


# ── Direct dependency routes ───────────────────────────────────


@router.delete("/dependencies/{dep_id}", response_model=MessageResponse)
async def delete_dependency(
    dep_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DependencyService(session)
    await service.delete_dependency(dep_id)
    return MessageResponse(message="Dependency deleted")


# ── Impact analysis ────────────────────────────────────────────


@router.get(
    "/projects/{project_id}/impact",
    response_model=ImpactAnalysisResponse,
)
async def get_impact_analysis(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DependencyService(session)
    return await service.analyze_impact(project_id)
