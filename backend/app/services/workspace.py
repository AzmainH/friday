from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.workspace import Workspace
from app.repositories.workspace import WorkspaceRepository


class WorkspaceService:
    def __init__(self, session: AsyncSession):
        self.repo = WorkspaceRepository(session)
        self.session = session

    async def get_workspace(self, workspace_id: UUID) -> Workspace:
        ws = await self.repo.get_by_id(workspace_id)
        if not ws:
            raise NotFoundException("Workspace not found")
        return ws

    async def list_by_org(
        self,
        org_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_org(
            org_id, cursor=cursor, limit=limit, include_count=include_count
        )

    async def create_workspace(
        self, data: dict, *, created_by: UUID | None = None
    ) -> Workspace:
        existing = await self.repo.get_by_slug(
            data["org_id"], data.get("slug", "")
        )
        if existing:
            raise ConflictException(
                "A workspace with this slug already exists in this organization"
            )
        return await self.repo.create(data, created_by=created_by)

    async def update_workspace(
        self,
        workspace_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> Workspace:
        ws = await self.repo.update(
            workspace_id, data, updated_by=updated_by
        )
        if not ws:
            raise NotFoundException("Workspace not found")
        return ws

    async def delete_workspace(
        self, workspace_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(
            workspace_id, deleted_by=deleted_by
        )
        if not deleted:
            raise NotFoundException("Workspace not found")
        return True
