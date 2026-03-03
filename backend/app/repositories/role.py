from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Role)

    async def get_all(self) -> list[Role]:
        query = select(Role).order_by(Role.scope_type, Role.name)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_with_permissions(self, role_id: UUID) -> Role | None:
        query = (
            select(Role)
            .where(Role.id == role_id)
            .options(selectinload(Role.permissions))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
