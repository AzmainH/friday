from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.repositories.issue_extras import (
    ComponentRepository,
    FavoriteRepository,
    LabelRepository,
    NotificationRepository,
    RecentItemRepository,
    SavedViewRepository,
    TaskStatusRepository,
    TimeEntryRepository,
    UploadRepository,
    VersionRepository,
)


class LabelService:
    def __init__(self, session: AsyncSession):
        self.repo = LabelRepository(session)

    async def list_by_project(self, project_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_project(project_id, **kwargs)

    async def create_label(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ):
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def delete_label(self, label_id: UUID) -> bool:
        deleted = await self.repo.hard_delete(label_id)
        if not deleted:
            raise NotFoundException("Label not found")
        return True


class ComponentService:
    def __init__(self, session: AsyncSession):
        self.repo = ComponentRepository(session)

    async def get_component(self, component_id: UUID):
        component = await self.repo.get_by_id(component_id)
        if not component:
            raise NotFoundException("Component not found")
        return component

    async def list_by_project(self, project_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_project(project_id, **kwargs)

    async def create_component(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ):
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def update_component(
        self, component_id: UUID, data: dict, *, updated_by: UUID | None = None
    ):
        await self.get_component(component_id)
        updated = await self.repo.update(
            component_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Component not found")
        return updated

    async def delete_component(self, component_id: UUID) -> bool:
        deleted = await self.repo.hard_delete(component_id)
        if not deleted:
            raise NotFoundException("Component not found")
        return True


class VersionService:
    def __init__(self, session: AsyncSession):
        self.repo = VersionRepository(session)

    async def get_version(self, version_id: UUID):
        version = await self.repo.get_by_id(version_id)
        if not version:
            raise NotFoundException("Version not found")
        return version

    async def list_by_project(self, project_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_project(project_id, **kwargs)

    async def create_version(
        self, project_id: UUID, data: dict, *, created_by: UUID | None = None
    ):
        data["project_id"] = project_id
        return await self.repo.create(data, created_by=created_by)

    async def update_version(
        self, version_id: UUID, data: dict, *, updated_by: UUID | None = None
    ):
        await self.get_version(version_id)
        updated = await self.repo.update(
            version_id, data, updated_by=updated_by
        )
        if not updated:
            raise NotFoundException("Version not found")
        return updated

    async def delete_version(self, version_id: UUID) -> bool:
        deleted = await self.repo.hard_delete(version_id)
        if not deleted:
            raise NotFoundException("Version not found")
        return True


class TimeEntryService:
    def __init__(self, session: AsyncSession):
        self.repo = TimeEntryRepository(session)

    async def list_by_issue(self, issue_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_issue(issue_id, **kwargs)

    async def create_time_entry(
        self,
        issue_id: UUID,
        user_id: UUID,
        data: dict,
    ):
        data["issue_id"] = issue_id
        data["user_id"] = user_id
        return await self.repo.create(data)

    async def delete_time_entry(self, entry_id: UUID) -> bool:
        deleted = await self.repo.hard_delete(entry_id)
        if not deleted:
            raise NotFoundException("Time entry not found")
        return True


class SavedViewService:
    def __init__(self, session: AsyncSession):
        self.repo = SavedViewRepository(session)

    async def get_saved_view(self, view_id: UUID):
        view = await self.repo.get_by_id(view_id)
        if not view:
            raise NotFoundException("Saved view not found")
        return view

    async def list_by_project_and_user(
        self, project_id: UUID, user_id: UUID, **kwargs
    ) -> dict:
        return await self.repo.get_by_project_and_user(
            project_id, user_id, **kwargs
        )

    async def list_shared(self, project_id: UUID, **kwargs) -> dict:
        return await self.repo.get_shared_for_project(project_id, **kwargs)

    async def create_saved_view(
        self, project_id: UUID, user_id: UUID, data: dict
    ):
        data["project_id"] = project_id
        data["user_id"] = user_id
        return await self.repo.create(data)

    async def update_saved_view(self, view_id: UUID, data: dict):
        await self.get_saved_view(view_id)
        updated = await self.repo.update(view_id, data)
        if not updated:
            raise NotFoundException("Saved view not found")
        return updated

    async def delete_saved_view(self, view_id: UUID) -> bool:
        deleted = await self.repo.hard_delete(view_id)
        if not deleted:
            raise NotFoundException("Saved view not found")
        return True


class NotificationService:
    def __init__(self, session: AsyncSession):
        self.repo = NotificationRepository(session)

    async def list_by_user(
        self,
        user_id: UUID,
        *,
        is_read: bool | None = None,
        **kwargs,
    ) -> dict:
        return await self.repo.get_by_user(
            user_id, is_read=is_read, **kwargs
        )

    async def mark_read(self, notification_id: UUID) -> bool:
        success = await self.repo.mark_read(notification_id)
        if not success:
            raise NotFoundException("Notification not found")
        return True

    async def mark_all_read(self, user_id: UUID) -> int:
        return await self.repo.mark_all_read(user_id)


class FavoriteService:
    def __init__(self, session: AsyncSession):
        self.repo = FavoriteRepository(session)

    async def list_by_user(self, user_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_user(user_id, **kwargs)

    async def toggle(self, user_id: UUID, entity_type: str, entity_id: UUID):
        return await self.repo.toggle(user_id, entity_type, entity_id)


class RecentItemService:
    def __init__(self, session: AsyncSession):
        self.repo = RecentItemRepository(session)

    async def track(self, user_id: UUID, entity_type: str, entity_id: UUID):
        return await self.repo.track(user_id, entity_type, entity_id)

    async def get_recent(self, user_id: UUID, limit: int = 20):
        return await self.repo.get_recent(user_id, limit=limit)


class TaskStatusService:
    def __init__(self, session: AsyncSession):
        self.repo = TaskStatusRepository(session)

    async def get_task_status(self, task_id: UUID):
        task = await self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task status not found")
        return task

    async def list_by_user(self, user_id: UUID, **kwargs) -> dict:
        return await self.repo.get_by_user(user_id, **kwargs)

    async def update_progress(
        self, task_id: UUID, progress: int, status: str | None = None
    ):
        updated = await self.repo.update_progress(task_id, progress, status)
        if not updated:
            raise NotFoundException("Task status not found")
        return updated


class UploadService:
    def __init__(self, session: AsyncSession):
        self.repo = UploadRepository(session)

    async def create_upload(self, data: dict):
        return await self.repo.create(data)

    async def get_upload(self, upload_id: UUID):
        upload = await self.repo.get_by_id(upload_id)
        if not upload:
            raise NotFoundException("Upload not found")
        return upload
