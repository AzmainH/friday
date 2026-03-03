from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.core.errors import NotFoundException
from app.repositories.issue_relation import IssueLinkRepository
from app.schemas.base import MessageResponse
from app.schemas.issue_relation import IssueLinkCreate, IssueLinkResponse

router = APIRouter(tags=["issue-links"])


@router.get(
    "/issues/{issue_id}/links",
    response_model=list[IssueLinkResponse],
)
async def list_issue_links(
    issue_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    repo = IssueLinkRepository(session)
    return await repo.get_by_issue(issue_id)


@router.post(
    "/issues/{issue_id}/links",
    response_model=IssueLinkResponse,
    status_code=201,
)
async def create_issue_link(
    issue_id: UUID,
    body: IssueLinkCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    repo = IssueLinkRepository(session)
    data = body.model_dump()
    data["source_issue_id"] = issue_id
    data["created_by"] = user_id
    return await repo.create(data)


@router.delete("/issue-links/{link_id}", response_model=MessageResponse)
async def delete_issue_link(
    link_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    repo = IssueLinkRepository(session)
    deleted = await repo.hard_delete(link_id)
    if not deleted:
        raise NotFoundException("Issue link not found")
    return MessageResponse(message="Issue link deleted")
