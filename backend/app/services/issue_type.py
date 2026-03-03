from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.issue_type import IssueType
from app.repositories.issue_type import IssueTypeRepository


class IssueTypeService:
    def __init__(self, session: AsyncSession):
        self.repo = IssueTypeRepository(session)
        self.session = session

    async def get_issue_type(self, issue_type_id: UUID) -> IssueType:
        issue_type = await self.repo.get_by_id(issue_type_id)
        if not issue_type:
            raise NotFoundException("Issue type not found")
        return issue_type

    async def list_by_project(
        self,
        project_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_project(
            project_id, cursor=cursor, limit=limit, include_count=include_count
        )

    async def create_issue_type(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> IssueType:
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def update_issue_type(
        self,
        issue_type_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> IssueType:
        await self.get_issue_type(issue_type_id)
        updated = await self.repo.update(
            issue_type_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Issue type not found")
        return updated

    async def delete_issue_type(
        self, issue_type_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.hard_delete(issue_type_id)
        if not deleted:
            raise NotFoundException("Issue type not found")
        return True
