"""Main integration service — CRUD operations + orchestration."""

import json
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.models.integration import Integration
from app.repositories.integration import IntegrationRepository, WebhookLogRepository
from app.services.integrations.webhook import WebhookService


class IntegrationService:
    def __init__(self, session: AsyncSession):
        self.repo = IntegrationRepository(session)
        self.log_repo = WebhookLogRepository(session)
        self.webhook_service = WebhookService(session)
        self.session = session

    # ── CRUD ─────────────────────────────────────────────────────

    async def list_integrations(self, project_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_project(project_id, **kwargs)

    async def create_integration(
        self,
        project_id: UUID,
        data: dict,
        *,
        created_by: UUID | None = None,
    ) -> Integration:
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def get_integration(self, integration_id: UUID) -> Integration:
        integration = await self.repo.get_by_id(integration_id)
        if not integration:
            raise NotFoundException("Integration not found")
        return integration

    async def update_integration(
        self,
        integration_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> Integration:
        updated = await self.repo.update(
            integration_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Integration not found")
        return updated

    async def delete_integration(
        self, integration_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(
            integration_id, deleted_by=deleted_by
        )
        if not deleted:
            raise NotFoundException("Integration not found")
        return True

    # ── Webhook Logs ─────────────────────────────────────────────

    async def list_logs(self, integration_id: UUID, **kwargs) -> dict:
        # Verify integration exists
        await self.get_integration(integration_id)
        return await self.log_repo.get_by_integration(integration_id, **kwargs)

    # ── Test Webhook ─────────────────────────────────────────────

    async def test_webhook(
        self, integration_id: UUID, event_type: str, payload: dict | None = None
    ) -> dict:
        integration = await self.get_integration(integration_id)
        if payload is None:
            payload = {"test": True, "message": "Test webhook from Friday"}

        success = await self.webhook_service.deliver_webhook(
            integration, event_type, payload
        )

        # Get the latest log entry for this integration
        logs = await self.log_repo.get_by_integration(
            integration_id, limit=1
        )
        latest_log = logs["data"][0] if logs["data"] else None

        return {
            "success": success,
            "status_code": latest_log.status_code if latest_log else None,
            "response_body": latest_log.response_body if latest_log else None,
        }
