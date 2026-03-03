from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.member import OrgMemberCreate, OrgMemberResponse
from app.schemas.organization import OrgCreate, OrgResponse, OrgUpdate
from app.services.member import MemberService
from app.services.organization import OrganizationService

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


@router.get("", response_model=CursorPage[OrgResponse])
async def list_organizations(
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = OrganizationService(session)
    result = await service.list_organizations(
        cursor=cursor, limit=limit, include_count=include_count
    )
    return _build_page(result)


@router.post("", response_model=OrgResponse, status_code=201)
async def create_organization(
    body: OrgCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = OrganizationService(session)
    return await service.create_organization(
        body.model_dump(), created_by=user_id
    )


@router.get("/{org_id}", response_model=OrgResponse)
async def get_organization(
    org_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = OrganizationService(session)
    return await service.get_organization(org_id)


@router.put("/{org_id}", response_model=OrgResponse)
async def update_organization(
    org_id: UUID,
    body: OrgUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = OrganizationService(session)
    return await service.update_organization(
        org_id, body.model_dump(exclude_unset=True), updated_by=user_id
    )


@router.delete("/{org_id}", response_model=MessageResponse)
async def delete_organization(
    org_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = OrganizationService(session)
    await service.delete_organization(org_id, deleted_by=user_id)
    return MessageResponse(message="Organization deleted")


# ── Org members ──────────────────────────────────────────────────


@router.get("/{org_id}/members", response_model=list[OrgMemberResponse])
async def list_org_members(
    org_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    return await service.list_org_members(org_id)


@router.post(
    "/{org_id}/members", response_model=OrgMemberResponse, status_code=201
)
async def add_org_member(
    org_id: UUID,
    body: OrgMemberCreate,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    return await service.add_org_member(
        org_id, body.user_id, body.role_id
    )


@router.delete("/{org_id}/members/{user_id}", response_model=MessageResponse)
async def remove_org_member(
    org_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = MemberService(session)
    await service.remove_org_member(org_id, user_id)
    return MessageResponse(message="Member removed from organization")
