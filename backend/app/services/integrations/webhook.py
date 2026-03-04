"""Webhook delivery service."""

import json
from datetime import datetime
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration import Integration
from app.repositories.integration import IntegrationRepository, WebhookLogRepository


class WebhookService:
    def __init__(self, session: AsyncSession):
        self.integration_repo = IntegrationRepository(session)
        self.log_repo = WebhookLogRepository(session)
        self.session = session

    async def deliver_webhook(
        self, integration: Integration, event_type: str, payload: dict
    ) -> bool:
        """Send webhook POST to configured URL and log the result."""
        config = json.loads(integration.config_json)
        url = config.get("url", "")
        secret = config.get("secret", "")

        log_data: dict = {
            "integration_id": integration.id,
            "event_type": event_type,
            "payload_json": json.dumps(payload, default=str),
        }

        try:
            headers = {
                "Content-Type": "application/json",
                "X-Friday-Event": event_type,
            }
            if secret:
                headers["X-Friday-Secret"] = secret

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)

            log_data["status_code"] = response.status_code
            log_data["response_body"] = response.text[:1000]
            log_data["success"] = 200 <= response.status_code < 300
        except Exception as e:
            log_data["status_code"] = 0
            log_data["response_body"] = str(e)[:1000]
            log_data["success"] = False

        await self.log_repo.create(log_data)

        # Update last_triggered_at
        integration.last_triggered_at = datetime.now().astimezone()
        await self.session.flush()

        return log_data["success"]

    async def deliver_to_project(
        self, project_id: UUID, event_type: str, payload: dict
    ) -> list[dict]:
        """Deliver webhook to all active webhook integrations for a project."""
        integrations = await self.integration_repo.get_active_by_project(project_id)
        webhook_integrations = [i for i in integrations if i.type.value == "webhook"]

        results = []
        for integration in webhook_integrations:
            success = await self.deliver_webhook(integration, event_type, payload)
            results.append(
                {"integration_id": str(integration.id), "success": success}
            )
        return results
