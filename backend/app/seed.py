"""Seed system roles and permissions. Idempotent — safe to run multiple times."""

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models import Role, RolePermission

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


async def _main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    async with async_session_factory() as session:
        await seed_system_roles(session)


if __name__ == "__main__":
    asyncio.run(_main())
