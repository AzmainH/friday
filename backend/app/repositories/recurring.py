from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recurring import RecurringRule
from app.repositories.base import BaseRepository


class RecurringRuleRepository(BaseRepository[RecurringRule]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RecurringRule)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_due_rules(self, now: datetime) -> list[RecurringRule]:
        """Return all active rules whose next_due_at is at or before `now`."""
        query = select(RecurringRule).where(
            RecurringRule.is_active == True,  # noqa: E712
            RecurringRule.next_due_at <= now,
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
