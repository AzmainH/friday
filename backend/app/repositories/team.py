from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team import Team, TeamMember
from app.repositories.base import BaseRepository


class TeamRepository(BaseRepository[Team]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Team)

    async def get_by_workspace(
        self, workspace_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"workspace_id": workspace_id}, **kwargs
        )


class TeamMemberRepository(BaseRepository[TeamMember]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, TeamMember)

    async def get_by_team(self, team_id: UUID) -> list[TeamMember]:
        query = select(TeamMember).where(TeamMember.team_id == team_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_user(self, user_id: UUID) -> list[TeamMember]:
        query = select(TeamMember).where(TeamMember.user_id == user_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_team_and_user(
        self, team_id: UUID, user_id: UUID
    ) -> TeamMember | None:
        query = select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
