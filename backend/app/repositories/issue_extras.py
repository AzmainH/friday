from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue_extras import (
    Component,
    Favorite,
    Label,
    Notification,
    RecentItem,
    SavedView,
    TaskStatus,
    TimeEntry,
    Upload,
    Version,
)
from app.repositories.base import BaseRepository


class LabelRepository(BaseRepository[Label]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Label)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )


class ComponentRepository(BaseRepository[Component]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Component)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )


class VersionRepository(BaseRepository[Version]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Version)

    async def get_by_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id}, **kwargs
        )


class TimeEntryRepository(BaseRepository[TimeEntry]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, TimeEntry)

    async def get_by_issue(
        self, issue_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"issue_id": issue_id}, **kwargs
        )


class SavedViewRepository(BaseRepository[SavedView]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SavedView)

    async def get_by_project_and_user(
        self, project_id: UUID, user_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id, "user_id": user_id},
            **kwargs,
        )

    async def get_shared_for_project(
        self, project_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"project_id": project_id, "is_shared": True},
            **kwargs,
        )


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Notification)

    async def get_by_user(
        self,
        user_id: UUID,
        *,
        is_read: bool | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        filters: dict[str, Any] = {"user_id": user_id}
        if is_read is not None:
            filters["is_read"] = is_read
        return await self.get_multi(filters=filters, **kwargs)

    async def mark_read(self, notification_id: UUID) -> bool:
        result = await self.update(notification_id, {"is_read": True})
        return result is not None

    async def mark_all_read(self, user_id: UUID) -> int:
        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount


class FavoriteRepository(BaseRepository[Favorite]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Favorite)

    async def get_by_user(
        self, user_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"user_id": user_id}, **kwargs
        )

    async def toggle(
        self, user_id: UUID, entity_type: str, entity_id: UUID
    ) -> Favorite | None:
        query = select(Favorite).where(
            Favorite.user_id == user_id,
            Favorite.entity_type == entity_type,
            Favorite.entity_id == entity_id,
        )
        result = await self.session.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            await self.session.delete(existing)
            await self.session.flush()
            return None

        return await self.create(
            {
                "user_id": user_id,
                "entity_type": entity_type,
                "entity_id": entity_id,
            }
        )


class RecentItemRepository(BaseRepository[RecentItem]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RecentItem)

    async def track(
        self, user_id: UUID, entity_type: str, entity_id: UUID
    ) -> RecentItem:
        query = select(RecentItem).where(
            RecentItem.user_id == user_id,
            RecentItem.entity_type == entity_type,
            RecentItem.entity_id == entity_id,
        )
        result = await self.session.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            from datetime import datetime, timezone

            existing.accessed_at = datetime.now(timezone.utc)
            await self.session.flush()
            await self.session.refresh(existing)
            return existing

        return await self.create(
            {
                "user_id": user_id,
                "entity_type": entity_type,
                "entity_id": entity_id,
            }
        )

    async def get_recent(
        self, user_id: UUID, limit: int = 20
    ) -> list[RecentItem]:
        query = (
            select(RecentItem)
            .where(RecentItem.user_id == user_id)
            .order_by(RecentItem.accessed_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class TaskStatusRepository(BaseRepository[TaskStatus]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, TaskStatus)

    async def get_by_user(
        self, user_id: UUID, **kwargs: Any
    ) -> dict[str, Any]:
        return await self.get_multi(
            filters={"user_id": user_id}, **kwargs
        )

    async def update_progress(
        self, task_id: UUID, progress: int, status: str | None = None
    ) -> TaskStatus | None:
        data: dict[str, Any] = {"progress": progress}
        if status is not None:
            data["status"] = status
        return await self.update(task_id, data)


class UploadRepository(BaseRepository[Upload]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Upload)
