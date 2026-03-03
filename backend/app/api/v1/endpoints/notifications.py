from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.issue_extras import NotificationResponse
from app.services.issue_extras import NotificationService

router = APIRouter(tags=["notifications"])


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
    "/me/notifications",
    response_model=CursorPage[NotificationResponse],
)
async def list_notifications(
    is_read: bool | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = NotificationService(session)
    result = await service.list_by_user(
        user_id,
        is_read=is_read,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.put(
    "/me/notifications/{notification_id}/read",
    response_model=MessageResponse,
)
async def mark_notification_read(
    notification_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = NotificationService(session)
    await service.mark_read(notification_id)
    return MessageResponse(message="Notification marked as read")


@router.put(
    "/me/notifications/read-all",
    response_model=MessageResponse,
)
async def mark_all_notifications_read(
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = NotificationService(session)
    count = await service.mark_all_read(user_id)
    return MessageResponse(message=f"{count} notifications marked as read")
