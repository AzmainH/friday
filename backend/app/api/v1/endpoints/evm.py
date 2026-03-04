"""Earned Value Management endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.evm import EVMResponse
from app.services.evm import EVMService

router = APIRouter(tags=["evm"])


@router.get(
    "/projects/{project_id}/evm",
    response_model=EVMResponse,
)
async def get_project_evm(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = EVMService(session)
    return await service.calculate_evm(project_id)
