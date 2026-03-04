"""Slack integration service."""

import json

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.integration import IntegrationRepository


class SlackService:
    def __init__(self, session: AsyncSession):
        self.repo = IntegrationRepository(session)
        self.session = session

    async def send_message(self, integration_id, message: str) -> bool:
        """Send a message to configured Slack channel via webhook URL."""
        integration = await self.repo.get_by_id(integration_id)
        if not integration:
            return False

        config = json.loads(integration.config_json)
        webhook_url = config.get("webhook_url", "")
        if not webhook_url:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    webhook_url,
                    json={"text": message},
                    headers={"Content-Type": "application/json"},
                )
            return response.status_code == 200
        except Exception:
            return False
