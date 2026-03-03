from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.portfolio import CrossProjectDependency, Release, ReleaseProject
from app.repositories.base import BaseRepository


class ReleaseRepository(BaseRepository[Release]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Release)

    async def get_by_workspace(
        self, workspace_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"workspace_id": workspace_id}, **kwargs
        )

    async def get_with_projects(self, release_id: UUID) -> Release | None:
        query = (
            select(Release)
            .where(Release.id == release_id)
            .options(selectinload(Release.release_projects))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class ReleaseProjectRepository(BaseRepository[ReleaseProject]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ReleaseProject)

    async def get_by_release_and_project(
        self, release_id: UUID, project_id: UUID
    ) -> ReleaseProject | None:
        query = select(ReleaseProject).where(
            ReleaseProject.release_id == release_id,
            ReleaseProject.project_id == project_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_release(
        self, release_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"release_id": release_id}, **kwargs
        )


class CrossProjectDependencyRepository(BaseRepository[CrossProjectDependency]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CrossProjectDependency)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        """Get dependencies where project is either source or target."""
        query = select(CrossProjectDependency).where(
            or_(
                CrossProjectDependency.source_project_id == project_id,
                CrossProjectDependency.target_project_id == project_id,
            )
        )

        sort_by = kwargs.get("sort_by", "created_at")
        sort_order = kwargs.get("sort_order", "desc")
        cursor = kwargs.get("cursor")
        limit = kwargs.get("limit", 50)
        include_count = kwargs.get("include_count", False)

        if cursor:
            cursor_filter = self._build_cursor_filter(cursor, sort_by, sort_order)
            query = query.where(cursor_filter)

        sort_column = getattr(CrossProjectDependency, sort_by)
        if sort_order == "desc":
            query = query.order_by(
                sort_column.desc(), CrossProjectDependency.id.desc()
            )
        else:
            query = query.order_by(
                sort_column.asc(), CrossProjectDependency.id.asc()
            )

        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        has_more = len(items) > limit
        if has_more:
            items = items[:limit]

        next_cursor = None
        if has_more and items:
            next_cursor = self._encode_cursor(items[-1], sort_by)

        total_count = None
        if include_count:
            from sqlalchemy import func

            count_query = select(func.count()).select_from(
                CrossProjectDependency
            ).where(
                or_(
                    CrossProjectDependency.source_project_id == project_id,
                    CrossProjectDependency.target_project_id == project_id,
                )
            )
            total_count = await self.session.scalar(count_query)

        return {
            "data": items,
            "next_cursor": next_cursor,
            "has_more": has_more,
            "total_count": total_count,
        }

    async def get_all_for_workspace(
        self, workspace_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        """Get all cross-project dependencies for projects in a workspace."""
        from app.models.project import Project

        subquery = select(Project.id).where(
            Project.workspace_id == workspace_id
        )
        if hasattr(Project, "is_deleted"):
            subquery = subquery.where(Project.is_deleted == False)  # noqa: E712

        query = select(CrossProjectDependency).where(
            or_(
                CrossProjectDependency.source_project_id.in_(subquery),
                CrossProjectDependency.target_project_id.in_(subquery),
            )
        )

        sort_by = kwargs.get("sort_by", "created_at")
        sort_order = kwargs.get("sort_order", "desc")
        cursor = kwargs.get("cursor")
        limit = kwargs.get("limit", 50)
        include_count = kwargs.get("include_count", False)

        if cursor:
            cursor_filter = self._build_cursor_filter(cursor, sort_by, sort_order)
            query = query.where(cursor_filter)

        sort_column = getattr(CrossProjectDependency, sort_by)
        if sort_order == "desc":
            query = query.order_by(
                sort_column.desc(), CrossProjectDependency.id.desc()
            )
        else:
            query = query.order_by(
                sort_column.asc(), CrossProjectDependency.id.asc()
            )

        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        has_more = len(items) > limit
        if has_more:
            items = items[:limit]

        next_cursor = None
        if has_more and items:
            next_cursor = self._encode_cursor(items[-1], sort_by)

        total_count = None
        if include_count:
            from sqlalchemy import func

            count_query = (
                select(func.count())
                .select_from(CrossProjectDependency)
                .where(
                    or_(
                        CrossProjectDependency.source_project_id.in_(subquery),
                        CrossProjectDependency.target_project_id.in_(subquery),
                    )
                )
            )
            total_count = await self.session.scalar(count_query)

        return {
            "data": items,
            "next_cursor": next_cursor,
            "has_more": has_more,
            "total_count": total_count,
        }
