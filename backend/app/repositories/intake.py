from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.intake import IntakeForm, IntakeSubmission
from app.repositories.base import BaseRepository


class IntakeFormRepository(BaseRepository[IntakeForm]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, IntakeForm)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_by_slug(self, slug: str) -> IntakeForm | None:
        query = select(IntakeForm).where(IntakeForm.public_slug == slug)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class IntakeSubmissionRepository(BaseRepository[IntakeSubmission]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, IntakeSubmission)

    async def get_by_form(
        self, form_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"form_id": form_id}, **kwargs
        )
