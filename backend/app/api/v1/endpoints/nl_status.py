from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.nl_status import (
    ParsedStatusUpdate,
    StatusConfirmRequest,
    StatusConfirmResponse,
    StatusUpdateRequest,
)
from app.services.nl_status_parser import NLStatusParserService

router = APIRouter(tags=["nl-status"], prefix="/projects")


@router.post(
    "/{project_id}/status/parse",
    response_model=ParsedStatusUpdate,
)
async def parse_status_update(
    project_id: UUID,
    body: StatusUpdateRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Parse a free-text status update against project tasks.

    Uses AI to semantically match free-text mentions to existing tasks
    and extract percent_complete, status changes, ETAs, and blockers.
    Falls back to mock data when MCP is not configured.
    """
    service = NLStatusParserService(session)
    result = await service.parse_update(project_id, body.free_text)
    return ParsedStatusUpdate(**result)


@router.post(
    "/{project_id}/status/confirm",
    response_model=StatusConfirmResponse,
)
async def confirm_status_update(
    project_id: UUID,
    body: StatusConfirmRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Apply confirmed status updates to the database.

    After the user reviews the AI-parsed matches, they confirm which
    updates to apply. This endpoint writes the changes to the DB.
    """
    service = NLStatusParserService(session)
    confirmed = [match.model_dump() for match in body.confirmed_updates]
    result = await service.apply_update(project_id, confirmed, user_id)
    return StatusConfirmResponse(**result)


@router.get(
    "/{project_id}/status/history",
)
async def get_status_history(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Return past status updates for a project.

    Returns an empty list for now — history tracking will be added
    in a future iteration.
    """
    return []
