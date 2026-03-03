from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wiki import WikiPage, WikiPageComment, WikiPageVersion, WikiSpace
from app.repositories.base import BaseRepository


class WikiSpaceRepository(BaseRepository[WikiSpace]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, WikiSpace)

    async def get_by_workspace(
        self, workspace_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"workspace_id": workspace_id}, **kwargs
        )

    async def get_by_slug(
        self, workspace_id: UUID, slug: str
    ) -> WikiSpace | None:
        query = select(WikiSpace).where(
            WikiSpace.workspace_id == workspace_id,
            WikiSpace.slug == slug,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class WikiPageRepository(BaseRepository[WikiPage]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, WikiPage)

    async def get_tree(self, space_id: UUID) -> list[WikiPage]:
        """Return all pages for a space, ordered for tree building."""
        query = (
            select(WikiPage)
            .where(WikiPage.space_id == space_id)
            .order_by(WikiPage.sort_order.asc(), WikiPage.title.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_with_occ(
        self,
        page_id: UUID,
        data: dict[str, Any],
        expected_version: int,
    ) -> WikiPage | None:
        """Update a wiki page only if the current version matches expected_version.

        Returns the updated page on success, or None if the version
        did not match (i.e. a concurrent modification occurred).
        """
        new_version = expected_version + 1
        data["version"] = new_version

        stmt = (
            update(WikiPage)
            .where(
                WikiPage.id == page_id,
                WikiPage.version == expected_version,
            )
            .values(**data)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()

        if result.rowcount == 0:
            return None

        # Reload the updated object
        return await self.get_by_id(page_id)

    async def search(
        self, query_text: str, space_id: UUID | None = None
    ) -> list[dict[str, Any]]:
        """Full-text search using the search_vector TSVECTOR column."""
        ts_query = func.plainto_tsquery("english", query_text)

        stmt = select(
            WikiPage.id.label("page_id"),
            WikiPage.title,
            WikiPage.slug,
            WikiPage.space_id,
            func.ts_headline(
                "english",
                func.coalesce(WikiPage.content, ""),
                ts_query,
                "StartSel=<mark>, StopSel=</mark>, MaxFragments=2, MaxWords=30",
            ).label("highlight"),
            func.ts_rank(WikiPage.search_vector, ts_query).label("relevance"),
        ).where(
            WikiPage.search_vector.op("@@")(ts_query),
        )

        if space_id is not None:
            stmt = stmt.where(WikiPage.space_id == space_id)

        stmt = stmt.order_by(func.ts_rank(WikiPage.search_vector, ts_query).desc())

        result = await self.session.execute(stmt)
        rows = result.all()
        return [
            {
                "page_id": row.page_id,
                "title": row.title,
                "slug": row.slug,
                "space_id": row.space_id,
                "highlight": row.highlight,
                "relevance": float(row.relevance) if row.relevance else None,
            }
            for row in rows
        ]

    async def get_by_slug(
        self, space_id: UUID, slug: str
    ) -> WikiPage | None:
        query = select(WikiPage).where(
            WikiPage.space_id == space_id,
            WikiPage.slug == slug,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class WikiPageVersionRepository(BaseRepository[WikiPageVersion]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, WikiPageVersion)

    async def get_by_page(
        self, page_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"page_id": page_id},
            sort_by="created_at",
            sort_order="desc",
            **kwargs,
        )

    async def get_by_version_number(
        self, page_id: UUID, version_number: int
    ) -> WikiPageVersion | None:
        query = select(WikiPageVersion).where(
            WikiPageVersion.page_id == page_id,
            WikiPageVersion.version_number == version_number,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class WikiPageCommentRepository(BaseRepository[WikiPageComment]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, WikiPageComment)

    async def get_threaded(self, page_id: UUID) -> list[WikiPageComment]:
        """Return all comments for a page, ordered by creation time.

        The caller (service layer) is responsible for assembling the
        flat list into a tree structure.
        """
        query = (
            select(WikiPageComment)
            .where(WikiPageComment.page_id == page_id)
            .order_by(WikiPageComment.created_at.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
