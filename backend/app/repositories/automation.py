from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.automation import AutomationExecutionLog, AutomationRule, TriggerType
from app.repositories.base import BaseRepository


class AutomationRuleRepository(BaseRepository[AutomationRule]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AutomationRule)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_enabled_by_trigger(
        self, project_id: UUID, trigger_type: TriggerType
    ) -> list[AutomationRule]:
        query = select(AutomationRule).where(
            AutomationRule.project_id == project_id,
            AutomationRule.is_enabled == True,  # noqa: E712
            AutomationRule.trigger_type == trigger_type,
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class AutomationExecutionLogRepository(BaseRepository[AutomationExecutionLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AutomationExecutionLog)

    async def get_by_rule(
        self, rule_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"rule_id": rule_id},
            sort_by="executed_at",
            sort_order="desc",
            **kwargs,
        )
