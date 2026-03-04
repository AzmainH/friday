"""Notification delivery service — routes notifications to email + in-app."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.issue_extras import NotificationRepository


class NotificationDeliveryService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = NotificationRepository(session)

    async def send_notification(
        self,
        user_id: UUID,
        title: str,
        body: str,
        *,
        notification_type: str = "info",
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        project_id: UUID | None = None,
    ) -> Notification:
        """Create in-app notification and optionally queue email delivery."""
        notification = await self.repo.create(
            {
                "user_id": user_id,
                "type": notification_type,
                "title": title,
                "body": body,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "project_id": project_id,
                "is_read": False,
            }
        )

        # Email delivery happens via ARQ background task.
        # The caller should enqueue send_email_notification separately if needed.

        return notification

    async def notify_issue_assigned(
        self, issue, assignee_id: UUID, assigned_by: UUID | None = None
    ):
        """Notify user when assigned to an issue."""
        await self.send_notification(
            user_id=assignee_id,
            title=f"Issue assigned: {issue.issue_key}",
            body=f"You were assigned to '{issue.summary}'",
            notification_type="assignment",
            entity_type="issue",
            entity_id=issue.id,
            project_id=issue.project_id,
        )

    async def notify_issue_mentioned(
        self, issue, mentioned_user_id: UUID, mentioned_by: UUID | None = None
    ):
        """Notify user when mentioned in an issue."""
        await self.send_notification(
            user_id=mentioned_user_id,
            title=f"Mentioned in: {issue.issue_key}",
            body=f"You were mentioned in '{issue.summary}'",
            notification_type="mention",
            entity_type="issue",
            entity_id=issue.id,
            project_id=issue.project_id,
        )

    async def notify_issue_status_changed(
        self, issue, watcher_ids: list[UUID], changed_by: UUID | None = None
    ):
        """Notify watchers when issue status changes."""
        for watcher_id in watcher_ids:
            if watcher_id != changed_by:
                await self.send_notification(
                    user_id=watcher_id,
                    title=f"Status changed: {issue.issue_key}",
                    body=f"'{issue.summary}' status was updated",
                    notification_type="status_change",
                    entity_type="issue",
                    entity_id=issue.id,
                    project_id=issue.project_id,
                )

    async def notify_comment_added(
        self, issue, comment, commenter_id: UUID, notify_user_ids: list[UUID]
    ):
        """Notify users when a comment is added."""
        for user_id in notify_user_ids:
            if user_id != commenter_id:
                await self.send_notification(
                    user_id=user_id,
                    title=f"New comment on: {issue.issue_key}",
                    body=(
                        comment.content[:200] if comment.content else "New comment added"
                    ),
                    notification_type="comment",
                    entity_type="issue",
                    entity_id=issue.id,
                    project_id=issue.project_id,
                )

    async def notify_sprint_started(
        self, sprint, project_member_ids: list[UUID], started_by: UUID | None = None
    ):
        """Notify project members when a sprint starts."""
        for member_id in project_member_ids:
            if member_id != started_by:
                await self.send_notification(
                    user_id=member_id,
                    title=f"Sprint started: {sprint.name}",
                    body=f"Sprint '{sprint.name}' has been started",
                    notification_type="sprint",
                    entity_type="sprint",
                    entity_id=sprint.id,
                    project_id=sprint.project_id,
                )
