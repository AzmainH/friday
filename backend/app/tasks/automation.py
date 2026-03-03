from datetime import datetime, timezone
from uuid import UUID

import structlog
from sqlalchemy import update

from app.core.database import async_session_factory
from app.models.automation import (
    ActionType,
    AutomationExecutionLog,
    AutomationRule,
    TriggerType,
)
from app.models.issue import Issue
from app.repositories.automation import AutomationRuleRepository

logger = structlog.get_logger()

MAX_CASCADE_DEPTH = 5


def _check_condition(condition_config: dict | None, trigger_data: dict) -> bool:
    """Check whether trigger_data satisfies every field in condition_config.

    Simple field-level equality matching: each key in condition_config must
    be present in trigger_data with a matching value.  The special key
    ``labels_include`` checks that all required labels are present in
    trigger_data["labels"].
    """
    if not condition_config:
        return True

    for key, expected in condition_config.items():
        if key == "labels_include":
            actual_labels = trigger_data.get("labels", [])
            if not isinstance(actual_labels, list):
                return False
            if not all(lbl in actual_labels for lbl in expected):
                return False
        else:
            actual = trigger_data.get(key)
            if actual != expected:
                return False
    return True


def _build_update_values(action_type: str, action_config: dict) -> dict:
    """Translate an action_type + action_config into column updates for the
    issues table.  Returns a dict of {column_name: value} or empty dict if
    the action doesn't map to a direct column update.
    """
    mapping: dict[str, str] = {
        ActionType.CHANGE_STATUS: "status_id",
        ActionType.CHANGE_ASSIGNEE: "assignee_id",
        ActionType.CHANGE_PRIORITY: "priority",
    }
    column = mapping.get(action_type)
    if column and column in action_config:
        value = action_config[column]
        # Attempt UUID conversion for FK columns
        if column in ("status_id", "assignee_id"):
            try:
                value = UUID(str(value))
            except (ValueError, AttributeError):
                pass
        return {column: value}
    return {}


async def evaluate_automations(
    ctx: dict,
    project_id: str,
    trigger_type: str,
    trigger_data: dict,
    *,
    _depth: int = 0,
    _seen_rule_ids: list[str] | None = None,
) -> dict:
    """Evaluate automation rules for a project + trigger combination.

    Loads all enabled rules matching the trigger, checks conditions, and
    executes matching actions.  Tracks cascade depth (max 5) and seen rule
    IDs to prevent infinite loops and circular references.
    """
    if _depth >= MAX_CASCADE_DEPTH:
        logger.warning(
            "automation_cascade_depth_exceeded",
            project_id=project_id,
            depth=_depth,
        )
        return {"executed": 0, "skipped_depth_limit": True}

    seen_rule_ids: list[str] = list(_seen_rule_ids or [])

    async with async_session_factory() as session:
        repo = AutomationRuleRepository(session)

        rules = await repo.get_enabled_by_trigger(
            UUID(project_id), TriggerType(trigger_type)
        )

        executed_count = 0

        for rule in rules:
            rule_id_str = str(rule.id)

            # Circular-reference guard
            if rule_id_str in seen_rule_ids:
                logger.info(
                    "automation_circular_reference_skipped",
                    rule_id=rule_id_str,
                )
                continue

            # Condition check
            if not _check_condition(rule.condition_config, trigger_data):
                logger.debug(
                    "automation_condition_not_met",
                    rule_id=rule_id_str,
                )
                continue

            seen_rule_ids.append(rule_id_str)
            issue_id_str = trigger_data.get("issue_id")
            issue_id = UUID(issue_id_str) if issue_id_str else None
            error_message: str | None = None
            success = True

            try:
                # Execute action via direct SQL update on the issues table
                update_values = _build_update_values(
                    rule.action_type, rule.action_config
                )
                if update_values and issue_id:
                    stmt = (
                        update(Issue)
                        .where(Issue.id == issue_id)
                        .values(**update_values)
                    )
                    await session.execute(stmt)

                # Update execution metadata on the rule
                rule.execution_count = (rule.execution_count or 0) + 1
                rule.last_executed_at = datetime.now(timezone.utc)
                executed_count += 1

            except Exception as exc:
                success = False
                error_message = str(exc)
                logger.error(
                    "automation_execution_error",
                    rule_id=rule_id_str,
                    error=error_message,
                )

            # Log the execution
            log_entry = AutomationExecutionLog(
                rule_id=rule.id,
                issue_id=issue_id,
                trigger_data=trigger_data,
                success=success,
                error_message=error_message,
            )
            session.add(log_entry)

        await session.commit()

    logger.info(
        "automation_evaluation_complete",
        project_id=project_id,
        trigger_type=trigger_type,
        executed=executed_count,
        depth=_depth,
    )

    return {"executed": executed_count, "depth": _depth}
