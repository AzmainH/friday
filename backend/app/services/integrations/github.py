"""GitHub integration service."""

import json

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.integration import IntegrationRepository


class GitHubService:
    def __init__(self, session: AsyncSession):
        self.repo = IntegrationRepository(session)
        self.session = session

    async def link_pr_to_issue(self, integration_id, pr_data: dict):
        """Link a GitHub PR to a Friday issue (store reference)."""
        # Placeholder for future implementation
        pass

    async def sync_github_issue(self, integration_id, github_issue: dict):
        """Create/update a Friday issue from a GitHub issue."""
        # Placeholder for future implementation
        pass
