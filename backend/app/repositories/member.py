from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.members import OrgMember, ProjectMember, WorkspaceMember
from app.repositories.base import BaseRepository


class OrgMemberRepository(BaseRepository[OrgMember]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, OrgMember)

    async def get_by_org_and_user(
        self, org_id: UUID, user_id: UUID
    ) -> OrgMember | None:
        query = select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == user_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_org(self, org_id: UUID) -> list[OrgMember]:
        query = select(OrgMember).where(OrgMember.org_id == org_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())


class WorkspaceMemberRepository(BaseRepository[WorkspaceMember]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, WorkspaceMember)

    async def get_by_workspace_and_user(
        self, ws_id: UUID, user_id: UUID
    ) -> WorkspaceMember | None:
        query = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == ws_id,
            WorkspaceMember.user_id == user_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_workspace(self, ws_id: UUID) -> list[WorkspaceMember]:
        query = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == ws_id
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class ProjectMemberRepository(BaseRepository[ProjectMember]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ProjectMember)

    async def get_by_project_and_user(
        self, project_id: UUID, user_id: UUID
    ) -> ProjectMember | None:
        query = select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: UUID) -> list[ProjectMember]:
        query = select(ProjectMember).where(
            ProjectMember.project_id == project_id
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
