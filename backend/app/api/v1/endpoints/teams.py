from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.team import (
    TeamCreate,
    TeamMemberCreate,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
)
from app.services.team import TeamService

router = APIRouter(tags=["teams"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Scoped under workspaces ──────────────────────────────────────


@router.get(
    "/workspaces/{workspace_id}/teams",
    response_model=CursorPage[TeamResponse],
)
async def list_teams(
    workspace_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = TeamService(session)
    result = await service.list_by_workspace(
        workspace_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/workspaces/{workspace_id}/teams",
    response_model=TeamResponse,
    status_code=201,
)
async def create_team(
    workspace_id: UUID,
    body: TeamCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = TeamService(session)
    data = body.model_dump()
    data["workspace_id"] = workspace_id
    return await service.create_team(data, created_by=user_id)


# ── Direct team routes ───────────────────────────────────────────


@router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = TeamService(session)
    return await service.get_team(team_id)


@router.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: UUID,
    body: TeamUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = TeamService(session)
    return await service.update_team(
        team_id, body.model_dump(exclude_unset=True), updated_by=user_id
    )


@router.delete("/teams/{team_id}", response_model=MessageResponse)
async def delete_team(
    team_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = TeamService(session)
    await service.delete_team(team_id, deleted_by=user_id)
    return MessageResponse(message="Team deleted")


# ── Team members ─────────────────────────────────────────────────


@router.post(
    "/teams/{team_id}/members",
    response_model=TeamMemberResponse,
    status_code=201,
)
async def add_team_member(
    team_id: UUID,
    body: TeamMemberCreate,
    session: AsyncSession = Depends(get_db),
):
    service = TeamService(session)
    return await service.add_member(team_id, body.user_id)


@router.delete(
    "/teams/{team_id}/members/{user_id}", response_model=MessageResponse
)
async def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = TeamService(session)
    await service.remove_member(team_id, user_id)
    return MessageResponse(message="Member removed from team")
