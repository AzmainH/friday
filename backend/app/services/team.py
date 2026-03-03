from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.team import Team, TeamMember
from app.repositories.team import TeamMemberRepository, TeamRepository


class TeamService:
    def __init__(self, session: AsyncSession):
        self.repo = TeamRepository(session)
        self.member_repo = TeamMemberRepository(session)
        self.session = session

    async def get_team(self, team_id: UUID) -> Team:
        team = await self.repo.get_by_id(team_id)
        if not team:
            raise NotFoundException("Team not found")
        return team

    async def list_by_workspace(
        self,
        workspace_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_workspace(
            workspace_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_team(
        self, data: dict, *, created_by: UUID | None = None
    ) -> Team:
        return await self.repo.create(data, created_by=created_by)

    async def update_team(
        self, team_id: UUID, data: dict, *, updated_by: UUID | None = None
    ) -> Team:
        team = await self.repo.update(team_id, data, updated_by=updated_by)
        if not team:
            raise NotFoundException("Team not found")
        return team

    async def delete_team(
        self, team_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(team_id, deleted_by=deleted_by)
        if not deleted:
            raise NotFoundException("Team not found")
        return True

    async def add_member(
        self, team_id: UUID, user_id: UUID
    ) -> TeamMember:
        await self.get_team(team_id)
        existing = await self.member_repo.get_by_team_and_user(
            team_id, user_id
        )
        if existing:
            raise ConflictException("User is already a member of this team")
        return await self.member_repo.create(
            {"team_id": team_id, "user_id": user_id}
        )

    async def remove_member(self, team_id: UUID, user_id: UUID) -> bool:
        member = await self.member_repo.get_by_team_and_user(team_id, user_id)
        if not member:
            raise NotFoundException("Team member not found")
        return await self.member_repo.hard_delete(member.id)
