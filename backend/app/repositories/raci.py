from typing import Any
from uuid import UUID

from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.raci import RACIAssignment, RACIRoleType
from app.repositories.base import BaseRepository


class RACIRepository(BaseRepository[RACIAssignment]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RACIAssignment)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )

    async def get_matrix(self, project_id: UUID) -> list[RACIAssignment]:
        query = (
            select(RACIAssignment)
            .where(RACIAssignment.project_id == project_id)
            .order_by(
                RACIAssignment.issue_id.asc().nullsfirst(),
                RACIAssignment.created_at.asc(),
            )
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def upsert(self, data: dict) -> RACIAssignment:
        query = select(RACIAssignment).where(
            and_(
                RACIAssignment.project_id == data["project_id"],
                RACIAssignment.issue_id == data.get("issue_id"),
                RACIAssignment.user_id == data["user_id"],
                RACIAssignment.role_type == data["role_type"],
            )
        )
        result = await self.session.execute(query)
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        return await self.create(data)

    async def delete_assignment(self, assignment_id: UUID) -> bool:
        return await self.hard_delete(assignment_id)

    async def delete_all_for_project(self, project_id: UUID) -> None:
        stmt = delete(RACIAssignment).where(
            RACIAssignment.project_id == project_id
        )
        await self.session.execute(stmt)
        await self.session.flush()
