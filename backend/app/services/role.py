from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.models.role import Role
from app.repositories.role import RoleRepository


class RoleService:
    def __init__(self, session: AsyncSession):
        self.repo = RoleRepository(session)
        self.session = session

    async def list_roles(self) -> list[Role]:
        return await self.repo.get_all()

    async def get_role(self, role_id: UUID) -> Role:
        role = await self.repo.get_with_permissions(role_id)
        if not role:
            raise NotFoundException("Role not found")
        return role
