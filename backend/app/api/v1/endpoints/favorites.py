from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_extras import FavoriteCreate, FavoriteResponse
from app.services.issue_extras import FavoriteService

router = APIRouter(tags=["favorites"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


@router.get(
    "/me/favorites",
    response_model=CursorPage[FavoriteResponse],
)
async def list_favorites(
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = FavoriteService(session)
    result = await service.list_by_user(
        user_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/me/favorites",
    response_model=FavoriteResponse | MessageResponse,
)
async def toggle_favorite(
    body: FavoriteCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = FavoriteService(session)
    result = await service.toggle(user_id, body.entity_type, body.entity_id)
    if result is None:
        return MessageResponse(message="Favorite removed")
    return result
