from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.sla import IssueSLAStatus, SLAPolicy


class SLAService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ------------------------------------------------------------------
    # SLA Policy CRUD
    # ------------------------------------------------------------------

    async def get_policy(self, policy_id: UUID) -> SLAPolicy:
        result = await self.session.execute(
            select(SLAPolicy).where(SLAPolicy.id == policy_id)
        )
        policy = result.scalar_one_or_none()
        if not policy:
            raise NotFoundException("SLA policy not found")
        return policy

    async def list_policies_by_project(
        self,
        project_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        """Return paginated SLA policies for a project.

        Uses a simple offset-free query approach consistent with the
        BaseRepository pattern but implemented inline since SLAPolicy
        does not require soft-delete support.
        """
        from app.repositories.base import BaseRepository

        class _PolicyRepo(BaseRepository[SLAPolicy]):
            def __init__(self, session: AsyncSession):
                super().__init__(session, SLAPolicy)

        repo = _PolicyRepo(self.session)
        return await repo.get_multi(
            filters={"project_id": project_id},
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_policy(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ) -> SLAPolicy:
        data["project_id"] = project_id
        if created_by:
            data["created_by"] = created_by
            data["updated_by"] = created_by
        policy = SLAPolicy(**data)
        self.session.add(policy)
        await self.session.flush()
        await self.session.refresh(policy)
        return policy

    async def update_policy(
        self,
        policy_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ) -> SLAPolicy:
        policy = await self.get_policy(policy_id)
        if updated_by:
            data["updated_by"] = updated_by
        for key, value in data.items():
            setattr(policy, key, value)
        await self.session.flush()
        await self.session.refresh(policy)
        return policy

    async def delete_policy(self, policy_id: UUID) -> bool:
        policy = await self.get_policy(policy_id)
        await self.session.delete(policy)
        await self.session.flush()
        return True

    # ------------------------------------------------------------------
    # Issue SLA Status
    # ------------------------------------------------------------------

    async def get_status_for_issue(self, issue_id: UUID) -> IssueSLAStatus | None:
        result = await self.session.execute(
            select(IssueSLAStatus).where(IssueSLAStatus.issue_id == issue_id)
        )
        return result.scalar_one_or_none()

    async def apply_policy_to_issue(
        self,
        issue_id: UUID,
        policy_id: UUID,
        issue_created_at: datetime,
    ) -> IssueSLAStatus:
        """Attach an SLA policy to an issue and compute deadlines."""
        existing = await self.get_status_for_issue(issue_id)
        if existing:
            raise ConflictException("Issue already has an SLA status attached")

        policy = await self.get_policy(policy_id)

        response_deadline = None
        if policy.response_hours is not None:
            response_deadline = issue_created_at + timedelta(hours=policy.response_hours)

        resolution_deadline = None
        if policy.resolution_hours is not None:
            resolution_deadline = issue_created_at + timedelta(hours=policy.resolution_hours)

        sla_status = IssueSLAStatus(
            issue_id=issue_id,
            policy_id=policy_id,
            response_deadline=response_deadline,
            resolution_deadline=resolution_deadline,
        )
        self.session.add(sla_status)
        await self.session.flush()
        await self.session.refresh(sla_status)
        return sla_status

    # ------------------------------------------------------------------
    # Breach checking
    # ------------------------------------------------------------------

    async def check_breaches(self) -> int:
        """Check all active (non-breached) SLA statuses for deadline violations.

        Returns the number of newly breached SLA statuses.
        """
        now = datetime.now(timezone.utc)
        breach_count = 0

        # Check response breaches
        result = await self.session.execute(
            select(IssueSLAStatus).where(
                IssueSLAStatus.response_breached == False,  # noqa: E712
                IssueSLAStatus.first_responded_at.is_(None),
                IssueSLAStatus.response_deadline.isnot(None),
                IssueSLAStatus.response_deadline <= now,
            )
        )
        response_breached = list(result.scalars().all())
        for sla_status in response_breached:
            sla_status.response_breached = True
            breach_count += 1

        # Check resolution breaches
        result = await self.session.execute(
            select(IssueSLAStatus).where(
                IssueSLAStatus.resolution_breached == False,  # noqa: E712
                IssueSLAStatus.resolved_at.is_(None),
                IssueSLAStatus.resolution_deadline.isnot(None),
                IssueSLAStatus.resolution_deadline <= now,
            )
        )
        resolution_breached = list(result.scalars().all())
        for sla_status in resolution_breached:
            sla_status.resolution_breached = True
            breach_count += 1

        await self.session.flush()
        return breach_count
