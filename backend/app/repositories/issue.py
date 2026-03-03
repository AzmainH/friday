from typing import Any
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.issue import Issue
from app.repositories.base import BaseRepository


class IssueRepository(BaseRepository[Issue]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Issue)

    async def get_by_project(
        self,
        project_id: UUID,
        *,
        status_id: UUID | None = None,
        issue_type_id: UUID | None = None,
        assignee_id: UUID | None = None,
        priority: str | None = None,
        milestone_id: UUID | None = None,
        search_text: str | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        filters: dict[str, Any] = {"project_id": project_id}
        if status_id:
            filters["status_id"] = status_id
        if issue_type_id:
            filters["issue_type_id"] = issue_type_id
        if assignee_id:
            filters["assignee_id"] = assignee_id
        if priority:
            filters["priority"] = priority
        if milestone_id:
            filters["milestone_id"] = milestone_id
        return await self.get_multi(
            filters=filters,
            eager_loads=[
                selectinload(Issue.status),
                selectinload(Issue.issue_type),
                selectinload(Issue.assignee),
            ],
            **kwargs,
        )

    async def get_by_key(self, issue_key: str) -> Issue | None:
        query = select(Issue).where(Issue.issue_key == issue_key)
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_with_relations(self, issue_id: UUID) -> Issue | None:
        query = (
            select(Issue)
            .where(Issue.id == issue_id)
            .options(
                selectinload(Issue.issue_type),
                selectinload(Issue.status),
                selectinload(Issue.assignee),
                selectinload(Issue.reporter),
            )
        )
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def search(
        self, project_id: UUID, query_text: str
    ) -> list[Issue]:
        ts_query = func.plainto_tsquery("english", query_text)
        query = (
            select(Issue)
            .where(
                Issue.project_id == project_id,
                Issue.search_vector.op("@@")(ts_query),
            )
            .options(
                selectinload(Issue.status),
                selectinload(Issue.issue_type),
                selectinload(Issue.assignee),
            )
        )
        query = self._apply_soft_delete_filter(query)
        query = query.order_by(
            func.ts_rank(Issue.search_vector, ts_query).desc()
        )
        query = query.limit(50)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def bulk_update(
        self, ids: list[UUID], data: dict[str, Any]
    ) -> int:
        stmt = (
            update(Issue)
            .where(Issue.id.in_(ids))
            .values(**data)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount
