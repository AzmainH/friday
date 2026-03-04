from __future__ import annotations

from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.issue import Issue
from app.repositories.issue import IssueRepository
from app.repositories.workflow import WorkflowRepository, WorkflowStatusRepository
from app.services.activity import log_activity
from app.services.event_bus import EventBus
from app.services.issue_key import IssueKeyService
from app.services.workflow import WorkflowEngine


class IssueService:
    def __init__(self, session: AsyncSession, redis: Redis | None = None):
        self.repo = IssueRepository(session)
        self.workflow_repo = WorkflowRepository(session)
        self.status_repo = WorkflowStatusRepository(session)
        self.key_service = IssueKeyService(session)
        self.workflow_engine = WorkflowEngine(session)
        self.session = session
        self._event_bus = EventBus(redis) if redis else None

    async def _publish(
        self,
        event_type: str,
        issue: Issue,
        *,
        user_id: UUID | None = None,
    ) -> None:
        """Publish a real-time event for an issue change (fire-and-forget)."""
        if not self._event_bus:
            return
        try:
            await self._event_bus.publish_project_event(
                project_id=str(issue.project_id),
                event_type=event_type,
                payload={
                    "issue_id": str(issue.id),
                    "issue_key": getattr(issue, "issue_key", None),
                    "summary": getattr(issue, "summary", None),
                },
                user_id=str(user_id) if user_id else None,
            )
        except Exception:
            pass  # Never let event publishing break the main flow

    async def get_issue(self, issue_id: UUID) -> Issue:
        issue = await self.repo.get_with_relations(issue_id)
        if not issue:
            raise NotFoundException("Issue not found")
        return issue

    async def get_issue_by_key(self, issue_key: str) -> Issue:
        issue = await self.repo.get_by_key(issue_key)
        if not issue:
            raise NotFoundException("Issue not found")
        return issue

    async def list_issues(
        self,
        project_id: UUID,
        *,
        status_id: UUID | None = None,
        issue_type_id: UUID | None = None,
        assignee_id: UUID | None = None,
        priority: str | None = None,
        milestone_id: UUID | None = None,
        search_text: str | None = None,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_by_project(
            project_id,
            status_id=status_id,
            issue_type_id=issue_type_id,
            assignee_id=assignee_id,
            priority=priority,
            milestone_id=milestone_id,
            search_text=search_text,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_issue(
        self,
        project_id: UUID,
        data: dict,
        *,
        reporter_id: UUID | None = None,
        created_by: UUID | None = None,
    ) -> Issue:
        issue_key = await self.key_service.generate_key(project_id)

        workflow = await self.workflow_repo.get_default_for_project(project_id)
        if not workflow or not workflow.statuses:
            raise ConflictException(
                "Project has no default workflow with statuses configured"
            )

        initial_status = sorted(workflow.statuses, key=lambda s: s.sort_order)[0]

        label_ids = data.pop("label_ids", [])
        component_ids = data.pop("component_ids", [])

        data["project_id"] = project_id
        data["issue_key"] = issue_key
        data["status_id"] = initial_status.id
        if reporter_id:
            data["reporter_id"] = reporter_id

        issue = await self.repo.create(data, created_by=created_by)

        await log_activity(
            self.session,
            issue_id=issue.id,
            user_id=created_by or reporter_id,
            action="created",
        )

        await self._publish("issue_created", issue, user_id=created_by or reporter_id)

        return issue

    async def update_issue(
        self,
        issue_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> Issue:
        issue = await self.get_issue(issue_id)

        label_ids = data.pop("label_ids", None)
        component_ids = data.pop("component_ids", None)

        tracked_fields = {
            "summary", "description", "priority", "assignee_id",
            "issue_type_id", "milestone_id", "estimated_hours",
            "story_points", "rag_status", "planned_start", "planned_end",
        }
        for field in tracked_fields:
            if field in data:
                old = str(getattr(issue, field, None))
                new = str(data[field])
                if old != new:
                    await log_activity(
                        self.session,
                        issue_id=issue_id,
                        user_id=updated_by,
                        action="updated",
                        field_name=field,
                        old_value=old,
                        new_value=new,
                    )

        updated = await self.repo.update(
            issue_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Issue not found")

        await self._publish("issue_updated", updated, user_id=updated_by)

        return updated

    async def transition_issue(
        self,
        issue_id: UUID,
        to_status_id: UUID,
        *,
        updated_by: UUID | None = None,
    ) -> Issue:
        issue = await self.get_issue(issue_id)
        new_status = await self.workflow_engine.validate_transition(
            issue, to_status_id
        )

        old_status_name = issue.status.name if issue.status else str(issue.status_id)
        updated = await self.repo.update(
            issue_id, {"status_id": to_status_id}, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Issue not found")

        await log_activity(
            self.session,
            issue_id=issue_id,
            user_id=updated_by,
            action="transitioned",
            field_name="status",
            old_value=old_status_name,
            new_value=new_status.name,
        )

        await self._publish("issue_updated", updated, user_id=updated_by)

        return updated

    async def bulk_update(
        self,
        issue_ids: list[UUID],
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> tuple[int, list[str]]:
        errors: list[str] = []
        if not issue_ids:
            return 0, errors

        clean_data = {k: v for k, v in data.items() if v is not None}
        if not clean_data:
            return 0, errors

        if updated_by and "updated_by" not in clean_data:
            clean_data["updated_by"] = updated_by

        count = await self.repo.bulk_update(issue_ids, clean_data)
        return count, errors

    async def search_issues(
        self, project_id: UUID, query_text: str
    ) -> list[Issue]:
        return await self.repo.search(project_id, query_text)

    async def delete_issue(
        self, issue_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        # Fetch issue before deletion for event payload
        issue = await self.get_issue(issue_id)
        deleted = await self.repo.soft_delete(issue_id, deleted_by=deleted_by)
        if not deleted:
            raise NotFoundException("Issue not found")

        await self._publish("issue_deleted", issue, user_id=deleted_by)

        return True
