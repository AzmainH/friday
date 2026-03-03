from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.organization import Organization
from app.repositories.organization import OrganizationRepository


class OrganizationService:
    def __init__(self, session: AsyncSession):
        self.repo = OrganizationRepository(session)
        self.session = session

    async def get_organization(self, org_id: UUID) -> Organization:
        org = await self.repo.get_by_id(org_id)
        if not org:
            raise NotFoundException("Organization not found")
        return org

    async def list_organizations(
        self,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_multi(
            cursor=cursor, limit=limit, include_count=include_count
        )

    async def create_organization(
        self, data: dict, *, created_by: UUID | None = None
    ) -> Organization:
        existing = await self.repo.get_by_slug(data["slug"])
        if existing:
            raise ConflictException(
                "An organization with this slug already exists"
            )
        return await self.repo.create(data, created_by=created_by)

    async def update_organization(
        self, org_id: UUID, data: dict, *, updated_by: UUID | None = None
    ) -> Organization:
        org = await self.repo.update(org_id, data, updated_by=updated_by)
        if not org:
            raise NotFoundException("Organization not found")
        return org

    async def delete_organization(
        self, org_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(org_id, deleted_by=deleted_by)
        if not deleted:
            raise NotFoundException("Organization not found")
        return True
