from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.member import (
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectMemberUpdate,
)
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.member import MemberService
from app.services.project import ProjectService

router = APIRouter(tags=["projects"])


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
    "/workspaces/{workspace_id}/projects",
    response_model=CursorPage[ProjectResponse],
)
async def list_projects(
    workspace_id: UUID,
    include_archived: bool = Query(False),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)
    result = await service.list_by_workspace(
        workspace_id,
        include_archived=include_archived,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/workspaces/{workspace_id}/projects",
    response_model=ProjectResponse,
    status_code=201,
)
async def create_project(
    workspace_id: UUID,
    body: ProjectCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ProjectService(session)
    data = body.model_dump()
    data["workspace_id"] = workspace_id
    return await service.create_project(data, created_by=user_id)


# ── Direct project routes ────────────────────────────────────────


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)
    return await service.get_project(project_id)


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ProjectService(session)
    return await service.update_project(
        project_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/projects/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ProjectService(session)
    await service.delete_project(project_id, deleted_by=user_id)
    return MessageResponse(message="Project deleted")


@router.put("/projects/{project_id}/archive", response_model=ProjectResponse)
async def archive_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ProjectService(session)
    return await service.archive_project(project_id, archived_by=user_id)


@router.put(
    "/projects/{project_id}/unarchive", response_model=ProjectResponse
)
async def unarchive_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)
    return await service.unarchive_project(project_id)


# ── Project members ──────────────────────────────────────────────


@router.get(
    "/projects/{project_id}/members",
    response_model=list[ProjectMemberResponse],
)
async def list_project_members(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    return await service.list_project_members(project_id)


@router.post(
    "/projects/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=201,
)
async def add_project_member(
    project_id: UUID,
    body: ProjectMemberCreate,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    return await service.add_project_member(
        project_id,
        body.user_id,
        body.role_id,
        capacity_pct=body.capacity_pct,
        hours_per_week=body.hours_per_week,
    )


@router.put(
    "/projects/{project_id}/members/{user_id}",
    response_model=ProjectMemberResponse,
)
async def update_project_member(
    project_id: UUID,
    user_id: UUID,
    body: ProjectMemberUpdate,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    return await service.update_project_member(
        project_id, user_id, body.model_dump(exclude_unset=True)
    )


@router.delete(
    "/projects/{project_id}/members/{user_id}",
    response_model=MessageResponse,
)
async def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    await service.remove_project_member(project_id, user_id)
    return MessageResponse(message="Member removed from project")
