from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.integration import Integration, WebhookLog
from app.repositories.base import BaseRepository


class IntegrationRepository(BaseRepository[Integration]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Integration)

    async def get_by_project(self, project_id: UUID, **kwargs):
        return await self.get_multi(filters={"project_id": project_id}, **kwargs)

    async def get_active_by_project(self, project_id: UUID):
        query = select(Integration).where(
            Integration.project_id == project_id,
            Integration.is_active == True,  # noqa: E712
            Integration.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_with_logs(self, integration_id: UUID):
        query = (
            select(Integration)
            .where(Integration.id == integration_id)
            .options(selectinload(Integration.webhook_logs))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class WebhookLogRepository(BaseRepository[WebhookLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, WebhookLog)

    async def get_by_integration(self, integration_id: UUID, **kwargs):
        return await self.get_multi(
            filters={"integration_id": integration_id},
            sort_by="created_at",
            sort_order="desc",
            **kwargs,
        )
