from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.members import OrgMember, ProjectMember, WorkspaceMember
from app.repositories.member import (
    OrgMemberRepository,
    ProjectMemberRepository,
    WorkspaceMemberRepository,
)


class MemberService:
    """Handles org, workspace, and project membership."""

    def __init__(self, session: AsyncSession):
        self.org_member_repo = OrgMemberRepository(session)
        self.ws_member_repo = WorkspaceMemberRepository(session)
        self.project_member_repo = ProjectMemberRepository(session)
        self.session = session

    # ── Org members ──────────────────────────────────────────────

    async def add_org_member(
        self, org_id: UUID, user_id: UUID, role_id: UUID
    ) -> OrgMember:
        existing = await self.org_member_repo.get_by_org_and_user(
            org_id, user_id
        )
        if existing:
            raise ConflictException(
                "User is already a member of this organization"
            )
        return await self.org_member_repo.create(
            {"org_id": org_id, "user_id": user_id, "role_id": role_id}
        )

    async def remove_org_member(
        self, org_id: UUID, user_id: UUID
    ) -> bool:
        member = await self.org_member_repo.get_by_org_and_user(
            org_id, user_id
        )
        if not member:
            raise NotFoundException("Organization member not found")
        return await self.org_member_repo.hard_delete(member.id)

    async def list_org_members(self, org_id: UUID) -> list[OrgMember]:
        return await self.org_member_repo.get_by_org(org_id)

    # ── Workspace members ────────────────────────────────────────

    async def add_workspace_member(
        self, ws_id: UUID, user_id: UUID, role_id: UUID
    ) -> WorkspaceMember:
        existing = await self.ws_member_repo.get_by_workspace_and_user(
            ws_id, user_id
        )
        if existing:
            raise ConflictException(
                "User is already a member of this workspace"
            )
        return await self.ws_member_repo.create(
            {"workspace_id": ws_id, "user_id": user_id, "role_id": role_id}
        )

    async def remove_workspace_member(
        self, ws_id: UUID, user_id: UUID
    ) -> bool:
        member = await self.ws_member_repo.get_by_workspace_and_user(
            ws_id, user_id
        )
        if not member:
            raise NotFoundException("Workspace member not found")
        return await self.ws_member_repo.hard_delete(member.id)

    async def list_workspace_members(
        self, ws_id: UUID
    ) -> list[WorkspaceMember]:
        return await self.ws_member_repo.get_by_workspace(ws_id)

    # ── Project members ──────────────────────────────────────────

    async def add_project_member(
        self,
        project_id: UUID,
        user_id: UUID,
        role_id: UUID,
        *,
        capacity_pct: float | None = None,
        hours_per_week: float | None = None,
    ) -> ProjectMember:
        existing = await self.project_member_repo.get_by_project_and_user(
            project_id, user_id
        )
        if existing:
            raise ConflictException(
                "User is already a member of this project"
            )
        obj: dict = {
            "project_id": project_id,
            "user_id": user_id,
            "role_id": role_id,
        }
        if capacity_pct is not None:
            obj["capacity_pct"] = capacity_pct
        if hours_per_week is not None:
            obj["hours_per_week"] = hours_per_week
        return await self.project_member_repo.create(obj)

    async def update_project_member(
        self, project_id: UUID, user_id: UUID, data: dict
    ) -> ProjectMember:
        member = await self.project_member_repo.get_by_project_and_user(
            project_id, user_id
        )
        if not member:
            raise NotFoundException("Project member not found")
        for key, value in data.items():
            setattr(member, key, value)
        await self.session.flush()
        await self.session.refresh(member)
        return member

    async def remove_project_member(
        self, project_id: UUID, user_id: UUID
    ) -> bool:
        member = await self.project_member_repo.get_by_project_and_user(
            project_id, user_id
        )
        if not member:
            raise NotFoundException("Project member not found")
        return await self.project_member_repo.hard_delete(member.id)

    async def list_project_members(
        self, project_id: UUID
    ) -> list[ProjectMember]:
        return await self.project_member_repo.get_by_project(project_id)
