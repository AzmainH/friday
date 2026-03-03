from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue_relation import IssueActivityLog, IssueComment, IssueLink
from app.repositories.base import BaseRepository


class IssueLinkRepository(BaseRepository[IssueLink]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, IssueLink)

    async def get_by_issue(self, issue_id: UUID) -> list[IssueLink]:
        query = select(IssueLink).where(
            or_(
                IssueLink.source_issue_id == issue_id,
                IssueLink.target_issue_id == issue_id,
            )
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class IssueCommentRepository(BaseRepository[IssueComment]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, IssueComment)

    async def get_by_issue(
        self, issue_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"issue_id": issue_id},
            sort_by="created_at",
            sort_order="asc",
            **kwargs,
        )


class IssueActivityRepository(BaseRepository[IssueActivityLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, IssueActivityLog)

    async def get_by_issue(
        self, issue_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"issue_id": issue_id},
            sort_by="created_at",
            sort_order="desc",
            **kwargs,
        )
