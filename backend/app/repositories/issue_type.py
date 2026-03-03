from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue_type import IssueType
from app.repositories.base import BaseRepository


class IssueTypeRepository(BaseRepository[IssueType]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, IssueType)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )
