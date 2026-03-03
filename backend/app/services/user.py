from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictException, NotFoundException
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.repositories.user import UserRepository


class UserService:
    def __init__(self, session: AsyncSession):
        self.repo = UserRepository(session)
        self.session = session

    async def get_user(self, user_id: UUID) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def get_by_email(self, email: str) -> User | None:
        return await self.repo.get_by_email(email)

    async def list_users(
        self,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.get_multi(
            cursor=cursor, limit=limit, include_count=include_count
        )

    async def create_user(
        self, data: dict, *, created_by: UUID | None = None
    ) -> User:
        existing = await self.repo.get_by_email(data["email"])
        if existing:
            raise ConflictException("A user with this email already exists")
        return await self.repo.create(data, created_by=created_by)

    async def update_user(
        self, user_id: UUID, data: dict, *, updated_by: UUID | None = None
    ) -> User:
        user = await self.repo.update(user_id, data, updated_by=updated_by)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def delete_user(
        self, user_id: UUID, *, deleted_by: UUID | None = None
    ) -> bool:
        deleted = await self.repo.soft_delete(user_id, deleted_by=deleted_by)
        if not deleted:
            raise NotFoundException("User not found")
        return True

    async def get_preferences(self, user_id: UUID) -> UserPreferences | None:
        query = select(UserPreferences).where(
            UserPreferences.user_id == user_id
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def update_preferences(
        self, user_id: UUID, data: dict
    ) -> UserPreferences:
        await self.get_user(user_id)
        query = select(UserPreferences).where(
            UserPreferences.user_id == user_id
        )
        result = await self.session.execute(query)
        prefs = result.scalar_one_or_none()

        if prefs:
            for key, value in data.items():
                setattr(prefs, key, value)
        else:
            prefs = UserPreferences(user_id=user_id, **data)
            self.session.add(prefs)

        await self.session.flush()
        await self.session.refresh(prefs)
        return prefs
