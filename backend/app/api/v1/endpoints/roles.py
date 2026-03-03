from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.role import RoleResponse
from app.services.role import RoleService

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleResponse])
async def list_roles(
    session: AsyncSession = Depends(get_db),
):
    service = RoleService(session)
    return await service.list_roles()


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = RoleService(session)
    return await service.get_role(role_id)
