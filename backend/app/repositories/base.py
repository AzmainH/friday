import base64
import json
from datetime import datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    def __init__(self, session: AsyncSession, model_class: type[ModelType]):
        self.session = session
        self.model_class = model_class

    def _has_soft_delete(self) -> bool:
        return hasattr(self.model_class, "is_deleted")

    def _apply_soft_delete_filter(self, query):
        if self._has_soft_delete():
            query = query.where(self.model_class.is_deleted == False)  # noqa: E712
        return query

    @staticmethod
    def _encode_cursor(item: Any, sort_by: str) -> str:
        sort_value = getattr(item, sort_by)
        if isinstance(sort_value, datetime):
            sort_value = sort_value.isoformat()
        elif isinstance(sort_value, UUID):
            sort_value = str(sort_value)
        cursor_data = {"v": sort_value, "id": str(item.id)}
        return base64.urlsafe_b64encode(
            json.dumps(cursor_data).encode()
        ).decode()

    def _build_cursor_filter(self, cursor: str, sort_by: str, sort_order: str):
        cursor_data = json.loads(base64.urlsafe_b64decode(cursor).decode())
        sort_value = cursor_data["v"]
        cursor_id = UUID(cursor_data["id"])

        if isinstance(sort_value, str):
            try:
                sort_value = datetime.fromisoformat(sort_value)
            except (ValueError, TypeError):
                pass

        sort_column = getattr(self.model_class, sort_by)
        id_column = self.model_class.id

        if sort_order == "desc":
            return or_(
                sort_column < sort_value,
                and_(sort_column == sort_value, id_column < cursor_id),
            )
        return or_(
            sort_column > sort_value,
            and_(sort_column == sort_value, id_column > cursor_id),
        )

    async def get_by_id(self, id: UUID) -> ModelType | None:
        query = select(self.model_class).where(self.model_class.id == id)
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        *,
        cursor: str | None = None,
        limit: int = 50,
        filters: dict[str, Any] | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        include_count: bool = False,
        eager_loads: list | None = None,
    ) -> dict[str, Any]:
        query = select(self.model_class)
        query = self._apply_soft_delete_filter(query)

        if eager_loads:
            for loader in eager_loads:
                query = query.options(loader)

        if filters:
            for key, value in filters.items():
                query = query.where(getattr(self.model_class, key) == value)

        if cursor:
            cursor_filter = self._build_cursor_filter(cursor, sort_by, sort_order)
            query = query.where(cursor_filter)

        sort_column = getattr(self.model_class, sort_by)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc(), self.model_class.id.desc())
        else:
            query = query.order_by(sort_column.asc(), self.model_class.id.asc())

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
            count_query = select(func.count()).select_from(self.model_class)
            count_query = self._apply_soft_delete_filter(count_query)
            if filters:
                for key, value in filters.items():
                    count_query = count_query.where(
                        getattr(self.model_class, key) == value
                    )
            total_count = await self.session.scalar(count_query)

        return {
            "data": items,
            "next_cursor": next_cursor,
            "has_more": has_more,
            "total_count": total_count,
        }

    async def create(
        self, obj_in: dict[str, Any], *, created_by: UUID | None = None
    ) -> ModelType:
        if created_by and hasattr(self.model_class, "created_by"):
            obj_in["created_by"] = created_by
            obj_in["updated_by"] = created_by
        db_obj = self.model_class(**obj_in)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(
        self,
        id: UUID,
        obj_in: dict[str, Any],
        *,
        updated_by: UUID | None = None,
    ) -> ModelType | None:
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return None
        if updated_by and hasattr(db_obj, "updated_by"):
            obj_in["updated_by"] = updated_by
        for key, value in obj_in.items():
            setattr(db_obj, key, value)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def soft_delete(self, id: UUID, *, deleted_by: UUID | None = None) -> bool:
        db_obj = await self.get_by_id(id)
        if not db_obj or not self._has_soft_delete():
            return False
        db_obj.is_deleted = True
        db_obj.deleted_at = datetime.now().astimezone()
        if deleted_by:
            db_obj.deleted_by = deleted_by
        await self.session.flush()
        return True

    async def hard_delete(self, id: UUID) -> bool:
        query = select(self.model_class).where(self.model_class.id == id)
        result = await self.session.execute(query)
        db_obj = result.scalar_one_or_none()
        if not db_obj:
            return False
        await self.session.delete(db_obj)
        await self.session.flush()
        return True
