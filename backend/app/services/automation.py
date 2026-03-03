from uuid import UUID

from arq.connections import ArqRedis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException, ValidationException
from app.models.automation import AutomationRule, TriggerType
from app.models.issue import Issue
from app.repositories.automation import (
    AutomationExecutionLogRepository,
    AutomationRuleRepository,
)
from app.tasks.automation import _build_update_values, _check_condition


class AutomationService:
    def __init__(self, session: AsyncSession):
        self.repo = AutomationRuleRepository(session)
        self.log_repo = AutomationExecutionLogRepository(session)
        self.session = session

    # ---- Rule CRUD ----

    async def get_rule(self, rule_id: UUID) -> AutomationRule:
        rule = await self.repo.get_by_id(rule_id)
        if not rule:
            raise NotFoundException("Automation rule not found")
        return rule

    async def list_by_project(
        self,
        project_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_project(
            project_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_rule(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> AutomationRule:
        # Validate trigger_type and action_type enums
        try:
            TriggerType(data.get("trigger_type", ""))
        except ValueError:
            raise ValidationException(
                f"Invalid trigger_type: {data.get('trigger_type')}"
            )

        from app.models.automation import ActionType

        try:
            ActionType(data.get("action_type", ""))
        except ValueError:
            raise ValidationException(
                f"Invalid action_type: {data.get('action_type')}"
            )

        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def update_rule(
        self,
        rule_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> AutomationRule:
        await self.get_rule(rule_id)

        if "trigger_type" in data:
            try:
                TriggerType(data["trigger_type"])
            except ValueError:
                raise ValidationException(
                    f"Invalid trigger_type: {data['trigger_type']}"
                )

        if "action_type" in data:
            from app.models.automation import ActionType

            try:
                ActionType(data["action_type"])
            except ValueError:
                raise ValidationException(
                    f"Invalid action_type: {data['action_type']}"
                )

        updated = await self.repo.update(rule_id, data, updated_by=updated_by)
        if not updated:
            raise NotFoundException("Automation rule not found")
        return updated

    async def delete_rule(self, rule_id: UUID) -> bool:
        await self.get_rule(rule_id)
        deleted = await self.repo.hard_delete(rule_id)
        if not deleted:
            raise NotFoundException("Automation rule not found")
        return True

    # ---- Test / Dry-run ----

    async def test_rule(
        self, rule_id: UUID, issue_id: UUID
    ) -> dict:
        """Dry-run a rule against a specific issue.

        Returns whether the rule would match and what actions would be taken,
        without actually executing anything.
        """
        rule = await self.get_rule(rule_id)

        result = await self.session.execute(
            select(Issue).where(Issue.id == issue_id)
        )
        issue = result.scalar_one_or_none()
        if not issue:
            raise NotFoundException("Issue not found")

        # Build a simulated trigger_data from the issue
        trigger_data: dict = {
            "issue_id": str(issue.id),
            "project_id": str(issue.project_id),
        }
        if hasattr(issue, "status_id") and issue.status_id:
            trigger_data["status_id"] = str(issue.status_id)
        if hasattr(issue, "assignee_id") and issue.assignee_id:
            trigger_data["assignee_id"] = str(issue.assignee_id)
        if hasattr(issue, "priority") and issue.priority is not None:
            trigger_data["priority"] = str(issue.priority)
        if hasattr(issue, "labels") and issue.labels:
            trigger_data["labels"] = issue.labels

        would_match = _check_condition(rule.condition_config, trigger_data)

        actions: list[dict] = []
        if would_match:
            update_values = _build_update_values(
                rule.action_type, rule.action_config
            )
            if update_values:
                actions.append(
                    {
                        "type": str(rule.action_type),
                        "updates": {
                            k: str(v) for k, v in update_values.items()
                        },
                    }
                )
            else:
                actions.append(
                    {
                        "type": str(rule.action_type),
                        "config": rule.action_config,
                    }
                )

        return {"would_match": would_match, "actions": actions}

    # ---- Execution Log ----

    async def get_execution_log(
        self,
        rule_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        # Ensure the rule exists
        await self.get_rule(rule_id)
        return await self.log_repo.get_by_rule(
            rule_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    # ---- Trigger (enqueue ARQ task) ----

    async def trigger(
        self,
        project_id: UUID,
        trigger_type: str,
        trigger_data: dict,
        arq_pool: ArqRedis,
    ) -> None:
        """Enqueue an ARQ task to evaluate automations asynchronously."""
        await arq_pool.enqueue_job(
            "evaluate_automations",
            str(project_id),
            trigger_type,
            trigger_data,
        )
