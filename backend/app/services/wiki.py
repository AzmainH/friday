from __future__ import annotations

import re
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException, VersionConflictException
from app.repositories.wiki import (
    WikiPageCommentRepository,
    WikiPageRepository,
    WikiPageVersionRepository,
    WikiSpaceRepository,
)
from app.schemas.wiki import WikiPageTreeNode


def _slugify(text: str) -> str:
    """Convert a title into a URL-friendly slug."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


class WikiService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.space_repo = WikiSpaceRepository(session)
        self.page_repo = WikiPageRepository(session)
        self.version_repo = WikiPageVersionRepository(session)
        self.comment_repo = WikiPageCommentRepository(session)

    # ── Spaces ────────────────────────────────────────────────────

    async def get_space(self, space_id: UUID):
        space = await self.space_repo.get_by_id(space_id)
        if not space:
            raise NotFoundException("Wiki space not found")
        return space

    async def list_spaces(
        self,
        workspace_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.space_repo.get_by_workspace(
            workspace_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_space(
        self,
        workspace_id: UUID,
        data: dict,
        *,
        created_by: UUID | None = None,
    ):
        # Check for slug uniqueness
        existing = await self.space_repo.get_by_slug(workspace_id, data["slug"])
        if existing:
            raise ConflictException(
                f"Wiki space with slug '{data['slug']}' already exists in this workspace"
            )
        data["workspace_id"] = workspace_id
        return await self.space_repo.create(data, created_by=created_by)

    async def update_space(
        self,
        space_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ):
        await self.get_space(space_id)
        updated = await self.space_repo.update(space_id, data, updated_by=updated_by)
        if not updated:
            raise NotFoundException("Wiki space not found")
        return updated

    async def delete_space(
        self, space_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        space = await self.space_repo.get_by_id(space_id)
        if not space:
            raise NotFoundException("Wiki space not found")
        deleted = await self.space_repo.hard_delete(space_id)
        if not deleted:
            raise NotFoundException("Wiki space not found")
        return True

    # ── Pages ─────────────────────────────────────────────────────

    async def get_page(self, page_id: UUID):
        page = await self.page_repo.get_by_id(page_id)
        if not page:
            raise NotFoundException("Wiki page not found")
        return page

    async def list_pages(
        self,
        space_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.page_repo.get_multi(
            filters={"space_id": space_id},
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def create_page(
        self,
        space_id: UUID,
        data: dict,
        *,
        created_by: UUID | None = None,
    ):
        # Ensure the space exists
        await self.get_space(space_id)

        # Auto-generate slug from title
        slug = _slugify(data.get("title", ""))
        # Check uniqueness, append suffix if needed
        base_slug = slug
        counter = 1
        while await self.page_repo.get_by_slug(space_id, slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        data["space_id"] = space_id
        data["slug"] = slug
        data["version"] = 1

        page = await self.page_repo.create(data, created_by=created_by)

        # Save initial version
        await self.version_repo.create(
            {
                "page_id": page.id,
                "version_number": 1,
                "title": page.title,
                "content": page.content,
                "edited_by": created_by,
                "change_summary": "Initial version",
            }
        )

        return page

    async def update_page(
        self,
        page_id: UUID,
        data: dict,
        *,
        updated_by: UUID | None = None,
    ):
        expected_version = data.pop("expected_version")

        # Build the update payload, keeping only set fields
        update_data: dict = {}
        if "title" in data and data["title"] is not None:
            update_data["title"] = data["title"]
        if "content" in data:
            update_data["content"] = data["content"]
        if "parent_id" in data:
            update_data["parent_id"] = data["parent_id"]
        if "sort_order" in data and data["sort_order"] is not None:
            update_data["sort_order"] = data["sort_order"]
        if updated_by and True:  # AuditMixin field
            update_data["updated_by"] = updated_by

        updated = await self.page_repo.update_with_occ(
            page_id, update_data, expected_version
        )
        if not updated:
            # Check whether the page exists at all
            page = await self.page_repo.get_by_id(page_id)
            if not page:
                raise NotFoundException("Wiki page not found")
            raise VersionConflictException(
                f"Expected version {expected_version} but page is at version {page.version}"
            )

        # Save a version snapshot
        change_parts = []
        if "title" in update_data:
            change_parts.append("title")
        if "content" in update_data:
            change_parts.append("content")
        change_summary = f"Updated {', '.join(change_parts)}" if change_parts else "Updated"

        await self.version_repo.create(
            {
                "page_id": page_id,
                "version_number": updated.version,
                "title": updated.title,
                "content": updated.content,
                "edited_by": updated_by,
                "change_summary": change_summary,
            }
        )

        return updated

    async def delete_page(
        self, page_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        page = await self.page_repo.get_by_id(page_id)
        if not page:
            raise NotFoundException("Wiki page not found")
        deleted = await self.page_repo.hard_delete(page_id)
        if not deleted:
            raise NotFoundException("Wiki page not found")
        return True

    # ── Tree ──────────────────────────────────────────────────────

    async def get_tree(self, space_id: UUID) -> list[WikiPageTreeNode]:
        """Build a recursive tree of pages for a space."""
        pages = await self.page_repo.get_tree(space_id)

        # Build lookup and root list
        node_map: dict[UUID, WikiPageTreeNode] = {}
        for page in pages:
            node_map[page.id] = WikiPageTreeNode(
                id=page.id,
                title=page.title,
                slug=page.slug,
                sort_order=page.sort_order,
                children=[],
            )

        roots: list[WikiPageTreeNode] = []
        for page in pages:
            node = node_map[page.id]
            if page.parent_id and page.parent_id in node_map:
                node_map[page.parent_id].children.append(node)
            else:
                roots.append(node)

        return roots

    # ── Version history ───────────────────────────────────────────

    async def get_version_history(
        self,
        page_id: UUID,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        await self.get_page(page_id)
        return await self.version_repo.get_by_page(
            page_id,
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def get_version(
        self, page_id: UUID, version_number: int
    ):
        await self.get_page(page_id)
        version = await self.version_repo.get_by_version_number(page_id, version_number)
        if not version:
            raise NotFoundException(
                f"Version {version_number} not found for this page"
            )
        return version

    # ── Search ────────────────────────────────────────────────────

    async def search(
        self, query: str, space_id: UUID | None = None
    ) -> list[dict]:
        return await self.page_repo.search(query, space_id)

    # ── Comments ──────────────────────────────────────────────────

    async def create_comment(
        self,
        page_id: UUID,
        author_id: UUID,
        data: dict,
    ):
        await self.get_page(page_id)
        data["page_id"] = page_id
        data["author_id"] = author_id
        return await self.comment_repo.create(data)

    async def list_comments_threaded(self, page_id: UUID) -> list[dict]:
        """Return comments as a threaded tree structure."""
        await self.get_page(page_id)
        comments = await self.comment_repo.get_threaded(page_id)

        # Build tree from flat list
        comment_map: dict[UUID, dict] = {}
        for c in comments:
            comment_map[c.id] = {
                "id": c.id,
                "page_id": c.page_id,
                "author_id": c.author_id,
                "parent_comment_id": c.parent_comment_id,
                "content": c.content,
                "created_at": c.created_at,
                "replies": [],
            }

        roots: list[dict] = []
        for c in comments:
            node = comment_map[c.id]
            if c.parent_comment_id and c.parent_comment_id in comment_map:
                comment_map[c.parent_comment_id]["replies"].append(node)
            else:
                roots.append(node)

        return roots
