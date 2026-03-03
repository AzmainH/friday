from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.schemas.user_preferences import (
    UserPreferencesResponse,
    UserPreferencesUpdate,
)
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["users"])


def _build_page(result: dict, response_cls: type = UserResponse) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = UserService(session)
    return await service.get_user(user_id)


@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def update_my_preferences(
    body: UserPreferencesUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = UserService(session)
    return await service.update_preferences(
        user_id, body.model_dump(exclude_unset=True)
    )


@router.get("", response_model=CursorPage[UserResponse])
async def list_users(
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = UserService(session)
    result = await service.list_users(
        cursor=cursor, limit=limit, include_count=include_count
    )
    return _build_page(result)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = UserService(session)
    return await service.create_user(
        body.model_dump(), created_by=user_id
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = UserService(session)
    return await service.get_user(user_id)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    session: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
):
    service = UserService(session)
    return await service.update_user(
        user_id,
        body.model_dump(exclude_unset=True),
        updated_by=current_user_id,
    )


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
):
    service = UserService(session)
    await service.delete_user(user_id, deleted_by=current_user_id)
    return MessageResponse(message="User deleted")
