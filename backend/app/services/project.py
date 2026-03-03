from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.project import Project
from app.repositories.project import ProjectRepository


class ProjectService:
    def __init__(self, session: AsyncSession):
        self.repo = ProjectRepository(session)
        self.session = session

    async def get_project(self, project_id: UUID) -> Project:
        project = await self.repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project not found")
        return project

    async def list_by_workspace(
        self,
        workspace_id: UUID,
        *,
        include_archived: bool = False,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_workspace(
            workspace_id,
            include_archived=include_archived,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_project(
        self, data: dict, *, created_by: UUID | None = None
    ) -> Project:
        existing = await self.repo.get_by_key_prefix(data["key_prefix"])
        if existing:
            raise ConflictException(
                "A project with this key prefix already exists"
            )
        return await self.repo.create(data, created_by=created_by)

    def _check_not_archived(self, project: Project) -> None:
        if project.archived_at is not None:
            raise ConflictException("Cannot modify an archived project")

    async def update_project(
        self,
        project_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> Project:
        project = await self.get_project(project_id)
        self._check_not_archived(project)
        updated = await self.repo.update(
            project_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Project not found")
        return updated

    async def delete_project(
        self, project_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(
            project_id, deleted_by=deleted_by
        )
        if not deleted:
            raise NotFoundException("Project not found")
        return True

    async def archive_project(
        self, project_id: UUID, *, archived_by: UUID
    ) -> Project:
        project = await self.get_project(project_id)
        if project.archived_at is not None:
            raise ConflictException("Project is already archived")
        updated = await self.repo.update(
            project_id,
            {
                "archived_at": datetime.now(timezone.utc),
                "archived_by": archived_by,
            },
            updated_by=archived_by,
        )
        if not updated:
            raise NotFoundException("Project not found")
        return updated

    async def unarchive_project(self, project_id: UUID) -> Project:
        project = await self.get_project(project_id)
        if project.archived_at is None:
            raise ConflictException("Project is not archived")
        updated = await self.repo.update(
            project_id,
            {"archived_at": None, "archived_by": None},
        )
        if not updated:
            raise NotFoundException("Project not found")
        return updated
