from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.models.project import Project


class IssueKeyService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def generate_key(self, project_id: UUID) -> str:
        result = await self.session.execute(
            select(Project.key_prefix).where(Project.id == project_id)
        )
        prefix = result.scalar_one_or_none()
        if not prefix:
            raise NotFoundException("Project not found")

        row = await self.session.execute(
            text(
                "SELECT counter FROM project_issue_counters "
                "WHERE project_id = :pid FOR UPDATE"
            ),
            {"pid": project_id},
        )
        current = row.scalar_one_or_none()

        if current is None:
            await self.session.execute(
                text(
                    "INSERT INTO project_issue_counters (project_id, counter) "
                    "VALUES (:pid, 1)"
                ),
                {"pid": project_id},
            )
            counter = 1
        else:
            counter = current + 1
            await self.session.execute(
                text(
                    "UPDATE project_issue_counters SET counter = :counter "
                    "WHERE project_id = :pid"
                ),
                {"pid": project_id, "counter": counter},
            )

        await self.session.flush()
        return f"{prefix}-{counter}"
