"""Seed system roles, permissions, default org/workspace, and dev user. Idempotent."""

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.deps import _DEV_USER_ID
from app.models import Organization, Role, RolePermission, User, Workspace
from app.models.members import OrgMember, WorkspaceMember

logger = logging.getLogger(__name__)

SYSTEM_ROLES: list[dict] = [
    {
        "name": "org_admin",
        "scope_type": "org",
        "description": "Full access to everything in the organization",
        "permissions": ["*"],
    },
    {
        "name": "org_member",
        "scope_type": "org",
        "description": "Can view workspaces they belong to",
        "permissions": ["org.view"],
    },
    {
        "name": "workspace_admin",
        "scope_type": "workspace",
        "description": "Full access to all projects in the workspace",
        "permissions": ["*"],
    },
    {
        "name": "workspace_member",
        "scope_type": "workspace",
        "description": "Can view projects, join projects",
        "permissions": ["workspace.view", "projects.view", "projects.join"],
    },
    {
        "name": "project_admin",
        "scope_type": "project",
        "description": "Full access within a project",
        "permissions": [
            "project.settings.manage",
            "project.members.manage",
            "project.delete",
            "project.archive",
            "issues.create",
            "issues.edit",
            "issues.delete",
            "issues.assign",
            "issues.transition",
            "issues.bulk_edit",
            "comments.create",
            "comments.edit_own",
            "comments.delete_any",
            "milestones.manage",
            "gates.approve",
            "budget.view",
            "budget.manage",
            "decisions.manage",
            "stakeholders.manage",
            "wiki.create",
            "wiki.edit",
            "wiki.delete",
            "roadmap.manage",
            "roadmap.view",
            "automations.manage",
            "reports.export",
        ],
    },
    {
        "name": "project_manager",
        "scope_type": "project",
        "description": "Can manage issues, milestones, budgets, workflows",
        "permissions": [
            "issues.create",
            "issues.edit",
            "issues.assign",
            "issues.transition",
            "issues.bulk_edit",
            "comments.create",
            "comments.edit_own",
            "comments.delete_any",
            "milestones.manage",
            "gates.approve",
            "budget.view",
            "budget.manage",
            "decisions.manage",
            "stakeholders.manage",
            "wiki.create",
            "wiki.edit",
            "roadmap.manage",
            "roadmap.view",
            "reports.export",
        ],
    },
    {
        "name": "project_member",
        "scope_type": "project",
        "description": "Can create/edit issues, comment, log time",
        "permissions": [
            "issues.create",
            "issues.edit",
            "issues.assign",
            "issues.transition",
            "comments.create",
            "comments.edit_own",
            "budget.view",
            "wiki.create",
            "wiki.edit",
            "roadmap.view",
        ],
    },
    {
        "name": "project_viewer",
        "scope_type": "project",
        "description": "Read-only access to project",
        "permissions": [
            "issues.view",
            "comments.view",
            "budget.view",
            "wiki.view",
            "roadmap.view",
        ],
    },
    {
        "name": "project_guest",
        "scope_type": "project",
        "description": "Limited read-only for external stakeholders",
        "permissions": ["issues.view", "comments.view"],
    },
]


async def seed_system_roles(session: AsyncSession) -> None:
    """Create system roles and their permissions if they don't already exist."""
    for role_def in SYSTEM_ROLES:
        result = await session.execute(
            select(Role).where(
                Role.name == role_def["name"],
                Role.scope_type == role_def["scope_type"],
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            logger.info("Role already exists: %s/%s", role_def["name"], role_def["scope_type"])
            continue

        role = Role(
            name=role_def["name"],
            scope_type=role_def["scope_type"],
            is_system=True,
            description=role_def["description"],
        )
        session.add(role)
        await session.flush()

        for perm in role_def["permissions"]:
            session.add(RolePermission(role_id=role.id, permission=perm))

        logger.info(
            "Created role: %s/%s with %d permissions",
            role_def["name"],
            role_def["scope_type"],
            len(role_def["permissions"]),
        )

    await session.commit()
    logger.info("System role seeding complete")


async def seed_default_workspace(session: AsyncSession) -> None:
    """Create default org, workspace, dev user, and memberships if not present."""
    # Ensure dev user exists
    result = await session.execute(select(User).where(User.id == _DEV_USER_ID))
    dev_user = result.scalar_one_or_none()
    if not dev_user:
        dev_user = User(
            id=_DEV_USER_ID,
            email="dev@local.dev",
            display_name="Dev User",
            timezone="UTC",
            is_active=True,
            is_deleted=False,
        )
        session.add(dev_user)
        await session.flush()
        logger.info("Created dev user")

    # Get org_admin and workspace_admin roles
    org_admin = await session.execute(
        select(Role).where(Role.name == "org_admin", Role.scope_type == "org")
    )
    ws_admin = await session.execute(
        select(Role).where(Role.name == "workspace_admin", Role.scope_type == "workspace")
    )
    org_admin_role = org_admin.scalar_one_or_none()
    ws_admin_role = ws_admin.scalar_one_or_none()
    if not org_admin_role or not ws_admin_role:
        logger.warning("Roles not found, skipping default workspace seed")
        await session.commit()
        return

    # Default org
    org_result = await session.execute(
        select(Organization).where(Organization.slug == "default")
    )
    org = org_result.scalar_one_or_none()
    if not org:
        org = Organization(
            name="Default",
            slug="default",
            is_deleted=False,
        )
        session.add(org)
        await session.flush()
        logger.info("Created default organization")

    # Default workspace
    ws_result = await session.execute(
        select(Workspace).where(
            Workspace.org_id == org.id,
            Workspace.slug == "default",
        )
    )
    ws = ws_result.scalar_one_or_none()
    if not ws:
        ws = Workspace(
            org_id=org.id,
            name="Default",
            slug="default",
            is_deleted=False,
        )
        session.add(ws)
        await session.flush()
        logger.info("Created default workspace")

    # Org membership
    om_result = await session.execute(
        select(OrgMember).where(
            OrgMember.org_id == org.id,
            OrgMember.user_id == _DEV_USER_ID,
        )
    )
    if not om_result.scalar_one_or_none():
        session.add(
            OrgMember(org_id=org.id, user_id=_DEV_USER_ID, role_id=org_admin_role.id)
        )
        logger.info("Added dev user to default org")

    # Workspace membership
    wm_result = await session.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == ws.id,
            WorkspaceMember.user_id == _DEV_USER_ID,
        )
    )
    if not wm_result.scalar_one_or_none():
        session.add(
            WorkspaceMember(
                workspace_id=ws.id,
                user_id=_DEV_USER_ID,
                role_id=ws_admin_role.id,
            )
        )
        logger.info("Added dev user to default workspace")

    await session.commit()
    logger.info("Default workspace seeding complete")


async def _main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    async with async_session_factory() as session:
        await seed_system_roles(session)
        await seed_default_workspace(session)


if __name__ == "__main__":
    asyncio.run(_main())
