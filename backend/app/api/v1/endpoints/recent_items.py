from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.services.issue_extras import RecentItemService

router = APIRouter(tags=["recent-items"])


class RecentItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    entity_type: str
    entity_id: UUID
    viewed_at: datetime


@router.get("/me/recent", response_model=list[RecentItemResponse])
@router.get("/recent-items", response_model=list[RecentItemResponse])
async def get_recent_items(
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RecentItemService(session)
    return await service.get_recent(user_id, limit=limit)
