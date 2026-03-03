from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.models.recurring import RecurrenceFrequency, RecurringRule
from app.repositories.recurring import RecurringRuleRepository
from app.services.issue import IssueService


class RecurringService:
    def __init__(self, session: AsyncSession):
        self.repo = RecurringRuleRepository(session)
        self.session = session

    async def get_rule(self, rule_id: UUID) -> RecurringRule:
        rule = await self.repo.get_by_id(rule_id)
        if not rule:
            raise NotFoundException("Recurring rule not found")
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
    ) -> RecurringRule:
        data["project_id"] = project_id
        # Compute the initial next_due_at if not provided
        if not data.get("next_due_at"):
            freq = data.get("frequency", "daily")
            data["next_due_at"] = self.compute_next_due_from_frequency(
                freq,
                day_of_week=data.get("day_of_week"),
                day_of_month=data.get("day_of_month"),
            )
        return await self.repo.create(data, created_by=created_by)

    async def update_rule(
        self,
        rule_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> RecurringRule:
        await self.get_rule(rule_id)
        updated = await self.repo.update(rule_id, data, updated_by=updated_by)
        if not updated:
            raise NotFoundException("Recurring rule not found")
        return updated

    async def delete_rule(self, rule_id: UUID) -> bool:
        deleted = await self.repo.hard_delete(rule_id)
        if not deleted:
            raise NotFoundException("Recurring rule not found")
        return True

    # ------------------------------------------------------------------
    # Next-due computation
    # ------------------------------------------------------------------

    @staticmethod
    def compute_next_due(rule: RecurringRule, from_dt: datetime | None = None) -> datetime:
        """Compute the next due datetime for a rule after ``from_dt``."""
        base = from_dt or datetime.now(timezone.utc)
        return RecurringService.compute_next_due_from_frequency(
            rule.frequency.value if isinstance(rule.frequency, RecurrenceFrequency) else rule.frequency,
            day_of_week=rule.day_of_week,
            day_of_month=rule.day_of_month,
            base=base,
        )

    @staticmethod
    def compute_next_due_from_frequency(
        frequency: str,
        *,
        day_of_week: int | None = None,
        day_of_month: int | None = None,
        base: datetime | None = None,
    ) -> datetime:
        """Return the next occurrence for the given frequency."""
        now = base or datetime.now(timezone.utc)

        if frequency == RecurrenceFrequency.DAILY.value:
            return now + timedelta(days=1)

        if frequency == RecurrenceFrequency.WEEKLY.value:
            target_dow = day_of_week if day_of_week is not None else 0
            days_ahead = (target_dow - now.weekday()) % 7 or 7
            return now + timedelta(days=days_ahead)

        if frequency == RecurrenceFrequency.BIWEEKLY.value:
            target_dow = day_of_week if day_of_week is not None else 0
            days_ahead = (target_dow - now.weekday()) % 7 or 7
            return now + timedelta(days=days_ahead + 7)

        if frequency == RecurrenceFrequency.MONTHLY.value:
            target_day = day_of_month if day_of_month is not None else 1
            year, month = now.year, now.month
            if now.day >= target_day:
                month += 1
                if month > 12:
                    month = 1
                    year += 1
            # Clamp day to valid range for the target month
            import calendar
            max_day = calendar.monthrange(year, month)[1]
            target_day = min(target_day, max_day)
            return now.replace(year=year, month=month, day=target_day, hour=0, minute=0, second=0, microsecond=0)

        if frequency == RecurrenceFrequency.QUARTERLY.value:
            target_day = day_of_month if day_of_month is not None else 1
            month = now.month
            # Jump to the first day of the next quarter
            next_quarter_month = ((month - 1) // 3 + 1) * 3 + 1
            year = now.year
            if next_quarter_month > 12:
                next_quarter_month = 1
                year += 1
            import calendar
            max_day = calendar.monthrange(year, next_quarter_month)[1]
            target_day = min(target_day, max_day)
            return now.replace(
                year=year, month=next_quarter_month, day=target_day,
                hour=0, minute=0, second=0, microsecond=0,
            )

        # Fallback: daily
        return now + timedelta(days=1)

    # ------------------------------------------------------------------
    # Process due rules — create issues and advance next_due
    # ------------------------------------------------------------------

    async def process_due_rules(self) -> int:
        """Find all rules that are due, create issues from their templates,
        and advance their ``next_due_at``.  Returns the count of issues created."""
        now = datetime.now(timezone.utc)
        rules = await self.repo.get_due_rules(now)

        issue_service = IssueService(self.session)
        created_count = 0

        for rule in rules:
            issue_data: dict = {
                "summary": rule.template_summary,
                "description": rule.template_description,
                "priority": rule.template_priority,
            }
            if rule.template_issue_type_id:
                issue_data["issue_type_id"] = rule.template_issue_type_id
            if rule.template_assignee_id:
                issue_data["assignee_id"] = rule.template_assignee_id

            try:
                await issue_service.create_issue(
                    rule.project_id,
                    issue_data,
                    reporter_id=rule.created_by,
                    created_by=rule.created_by,
                )
                created_count += 1
            except Exception:
                # Skip rules that fail — will be retried on next run
                continue

            # Advance the rule
            next_due = self.compute_next_due(rule, from_dt=now)
            await self.repo.update(
                rule.id,
                {"last_created_at": now, "next_due_at": next_due},
            )

        return created_count

    async def trigger_rule(
        self, rule_id: UUID, *, triggered_by: UUID | None = None
    ) -> RecurringRule:
        """Manually trigger a recurring rule to create an issue now."""
        rule = await self.get_rule(rule_id)
        now = datetime.now(timezone.utc)

        issue_service = IssueService(self.session)
        issue_data: dict = {
            "summary": rule.template_summary,
            "description": rule.template_description,
            "priority": rule.template_priority,
        }
        if rule.template_issue_type_id:
            issue_data["issue_type_id"] = rule.template_issue_type_id
        if rule.template_assignee_id:
            issue_data["assignee_id"] = rule.template_assignee_id

        await issue_service.create_issue(
            rule.project_id,
            issue_data,
            reporter_id=triggered_by or rule.created_by,
            created_by=triggered_by or rule.created_by,
        )

        next_due = self.compute_next_due(rule, from_dt=now)
        updated = await self.repo.update(
            rule.id,
            {"last_created_at": now, "next_due_at": next_due},
        )
        if not updated:
            raise NotFoundException("Recurring rule not found")
        return updated
