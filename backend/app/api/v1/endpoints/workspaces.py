from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.member import WorkspaceMemberCreate, WorkspaceMemberResponse
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from app.services.member import MemberService
from app.services.workspace import WorkspaceService

router = APIRouter(tags=["workspaces"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Scoped under organizations ───────────────────────────────────


@router.get(
    "/organizations/{org_id}/workspaces",
    response_model=CursorPage[WorkspaceResponse],
)
async def list_workspaces(
    org_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = WorkspaceService(session)
    result = await service.list_by_org(
        org_id, cursor=cursor, limit=limit, include_count=include_count
    )
    return _build_page(result)


@router.post(
    "/organizations/{org_id}/workspaces",
    response_model=WorkspaceResponse,
    status_code=201,
)
async def create_workspace(
    org_id: UUID,
    body: WorkspaceCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WorkspaceService(session)
    data = body.model_dump()
    data["org_id"] = org_id
    return await service.create_workspace(data, created_by=user_id)


# ── Direct workspace routes ──────────────────────────────────────


@router.get("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = WorkspaceService(session)
    return await service.get_workspace(workspace_id)


@router.put("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: UUID,
    body: WorkspaceUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WorkspaceService(session)
    return await service.update_workspace(
        workspace_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete(
    "/workspaces/{workspace_id}", response_model=MessageResponse
)
async def delete_workspace(
    workspace_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WorkspaceService(session)
    await service.delete_workspace(workspace_id, deleted_by=user_id)
    return MessageResponse(message="Workspace deleted")


# ── Workspace members ────────────────────────────────────────────


@router.get(
    "/workspaces/{workspace_id}/members",
    response_model=list[WorkspaceMemberResponse],
)
async def list_workspace_members(
    workspace_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    return await service.list_workspace_members(workspace_id)


@router.post(
    "/workspaces/{workspace_id}/members",
    response_model=WorkspaceMemberResponse,
    status_code=201,
)
async def add_workspace_member(
    workspace_id: UUID,
    body: WorkspaceMemberCreate,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    return await service.add_workspace_member(
        workspace_id, body.user_id, body.role_id
    )


@router.delete(
    "/workspaces/{workspace_id}/members/{user_id}",
    response_model=MessageResponse,
)
async def remove_workspace_member(
    workspace_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    await service.remove_workspace_member(workspace_id, user_id)
    return MessageResponse(message="Member removed from workspace")
