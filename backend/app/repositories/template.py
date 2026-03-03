from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.template import ProjectTemplate
from app.repositories.base import BaseRepository


class ProjectTemplateRepository(BaseRepository[ProjectTemplate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ProjectTemplate)

    async def list_all(self, **kwargs: Any) -> dict[str, Any]:
        return await self.get_multi(**kwargs)

    async def get_system_templates(self) -> list[ProjectTemplate]:
        query = (
            select(ProjectTemplate)
            .where(ProjectTemplate.is_system == True)  # noqa: E712
            .order_by(ProjectTemplate.name.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_name(self, name: str) -> ProjectTemplate | None:
        query = select(ProjectTemplate).where(ProjectTemplate.name == name)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
