from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue_relation import IssueActivityLog


async def log_activity(
    session: AsyncSession,
    *,
    issue_id: UUID,
    user_id: UUID | None,
    action: str,
    field_name: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
) -> IssueActivityLog:
    activity = IssueActivityLog(
        issue_id=issue_id,
        user_id=user_id,
        action=action,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
    )
    session.add(activity)
    await session.flush()
    await session.refresh(activity)
    return activity


async def log_audit(
    session: AsyncSession,
    *,
    entity_type: str,
    entity_id: UUID,
    user_id: UUID,
    action: str,
    changes: dict | None = None,
    request_id: str | None = None,
) -> None:
    from app.models.issue_extras import AuditLog

    audit = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        action=action,
        changes_json=changes,
        request_id=request_id,
    )
    session.add(audit)
    await session.flush()
