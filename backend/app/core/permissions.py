from uuid import UUID

import structlog
from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import CacheService, get_cache
from app.core.deps import get_current_user_id, get_db
from app.models import (
    OrgMember,
    Project,
    ProjectMember,
    RolePermission,
    Workspace,
    WorkspaceMember,
)

logger = structlog.get_logger(__name__)

SCOPE_HIERARCHY = {
    "org": 0,
    "workspace": 1,
    "project": 2,
}


def require_permission(permission: str):
    """Returns a FastAPI dependency that checks if the current user has the
    given permission.

    Permission inheritance: org_admin has full access everywhere.
    workspace_admin has full access to all projects in their workspace.

    The dependency extracts project_id / workspace_id / org_id from path
    parameters automatically.
    """

    async def _check(
        request: Request,
        user_id: UUID = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> UUID:
        path_params = request.path_params
        project_id = path_params.get("project_id")
        workspace_id = path_params.get("workspace_id")
        org_id = path_params.get("org_id")

        # Build cache service from request-scoped Redis
        cache: CacheService | None = None
        redis = getattr(request.app.state, "redis", None)
        if redis:
            cache = get_cache(redis)

        if project_id:
            result = await db.execute(
                select(Project).where(Project.id == UUID(project_id))
            )
            project_obj = result.scalar_one_or_none()
            if project_obj:
                workspace_id = str(project_obj.workspace_id)
                ws_result = await db.execute(
                    select(Workspace).where(
                        Workspace.id == project_obj.workspace_id
                    )
                )
                ws_obj = ws_result.scalar_one_or_none()
                if ws_obj:
                    org_id = str(ws_obj.org_id)
        elif workspace_id:
            result = await db.execute(
                select(Workspace).where(Workspace.id == UUID(workspace_id))
            )
            ws_obj = result.scalar_one_or_none()
            if ws_obj:
                org_id = str(ws_obj.org_id)

        # Check org-level (org_admin wildcard grants all permissions)
        if org_id:
            if await _check_scope_permission(
                db, user_id, "org", UUID(org_id), permission, cache=cache
            ):
                return user_id

        # Check workspace-level
        if workspace_id:
            if await _check_scope_permission(
                db, user_id, "workspace", UUID(workspace_id), permission,
                cache=cache,
            ):
                return user_id

        # Check project-level
        if project_id:
            if await _check_scope_permission(
                db, user_id, "project", UUID(project_id), permission,
                cache=cache,
            ):
                return user_id

        # Endpoints without a scoped resource ID — allow authenticated users
        if not project_id and not workspace_id and not org_id:
            return user_id

        from app.core.errors import PermissionDeniedException

        raise PermissionDeniedException(f"Missing permission: {permission}")

    return Depends(_check)


async def _check_scope_permission(
    db: AsyncSession,
    user_id: UUID,
    scope: str,
    scope_id: UUID,
    permission: str,
    *,
    cache: CacheService | None = None,
) -> bool:
    """Check if *user_id* has *permission* at the given scope level.

    A role with the wildcard ``"*"`` permission automatically satisfies any
    permission check (used by admin roles).

    Results are cached in Redis for 300 seconds (5 minutes) when a cache
    instance is provided.
    """
    cache_key = f"perm:{user_id}:{scope}:{scope_id}:{permission}"

    # Check cache first
    if cache:
        cached = await cache.get(cache_key)
        if cached is not None:
            return bool(cached)

    if scope == "org":
        member_query = select(OrgMember).where(
            OrgMember.org_id == scope_id,
            OrgMember.user_id == user_id,
        )
    elif scope == "workspace":
        member_query = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == scope_id,
            WorkspaceMember.user_id == user_id,
        )
    else:
        member_query = select(ProjectMember).where(
            ProjectMember.project_id == scope_id,
            ProjectMember.user_id == user_id,
        )

    result = await db.execute(member_query)
    member = result.scalar_one_or_none()
    if not member:
        if cache:
            await cache.set(cache_key, False, ttl=300)
        return False

    perm_query = select(RolePermission).where(
        RolePermission.role_id == member.role_id,
        RolePermission.permission.in_([permission, "*"]),
    )
    result = await db.execute(perm_query)
    has_perm = result.scalar_one_or_none() is not None

    if cache:
        await cache.set(cache_key, has_perm, ttl=300)

    return has_perm
