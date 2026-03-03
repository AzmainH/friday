from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import MessageResponse
from app.schemas.raci import (
    RACIAssignmentCreate,
    RACIAssignmentResponse,
    RACIBulkUpdate,
    RACIMatrixResponse,
)
from app.services.raci import RACIService

router = APIRouter(tags=["raci"])


@router.get(
    "/projects/{project_id}/raci",
    response_model=RACIMatrixResponse,
)
async def get_raci_matrix(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RACIService(session)
    return await service.get_matrix(project_id)


@router.post(
    "/projects/{project_id}/raci",
    response_model=RACIAssignmentResponse,
    status_code=201,
)
async def create_raci_assignment(
    project_id: UUID,
    body: RACIAssignmentCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RACIService(session)
    data = body.model_dump()
    return await service.set_assignment(project_id, data)


@router.put(
    "/projects/{project_id}/raci/bulk",
    response_model=list[RACIAssignmentResponse],
)
async def bulk_update_raci(
    project_id: UUID,
    body: RACIBulkUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = RACIService(session)
    assignments = [a.model_dump() for a in body.assignments]
    return await service.bulk_update(project_id, assignments)


@router.delete("/raci/{assignment_id}", response_model=MessageResponse)
async def delete_raci_assignment(
    assignment_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RACIService(session)
    await service.delete_assignment(assignment_id)
    return MessageResponse(message="RACI assignment deleted")
