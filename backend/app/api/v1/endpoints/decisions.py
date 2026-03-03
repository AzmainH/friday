from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.decision import (
    DecisionCreate,
    DecisionIssueLinkCreate,
    DecisionIssueLinkResponse,
    DecisionResponse,
    DecisionUpdate,
)
from app.services.decision import DecisionService

router = APIRouter(tags=["decisions"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# -- Scoped under projects ---------------------------------------------------


@router.get(
    "/projects/{project_id}/decisions",
    response_model=CursorPage[DecisionResponse],
)
async def list_decisions(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = DecisionService(session)
    result = await service.list_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/decisions",
    response_model=DecisionResponse,
    status_code=201,
)
async def create_decision(
    project_id: UUID,
    body: DecisionCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DecisionService(session)
    data = body.model_dump()
    return await service.create_decision(project_id, data, created_by=user_id)


# -- Direct decision routes --------------------------------------------------


@router.get("/decisions/{decision_id}", response_model=DecisionResponse)
async def get_decision(
    decision_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = DecisionService(session)
    return await service.get_decision(decision_id)


@router.patch("/decisions/{decision_id}", response_model=DecisionResponse)
async def update_decision(
    decision_id: UUID,
    body: DecisionUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DecisionService(session)
    data = body.model_dump(exclude_unset=True)
    return await service.update_decision(
        decision_id, data, updated_by=user_id
    )


@router.delete("/decisions/{decision_id}", response_model=MessageResponse)
async def delete_decision(
    decision_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DecisionService(session)
    await service.delete_decision(decision_id, deleted_by=user_id)
    return MessageResponse(message="Decision deleted")


# -- Decision-Issue links -----------------------------------------------------


@router.post(
    "/decisions/{decision_id}/links",
    response_model=DecisionIssueLinkResponse,
    status_code=201,
)
async def link_issue(
    decision_id: UUID,
    body: DecisionIssueLinkCreate,
    session: AsyncSession = Depends(get_db),
):
    service = DecisionService(session)
    return await service.link_issue(decision_id, body.issue_id)


@router.delete("/decision-links/{link_id}", response_model=MessageResponse)
async def unlink_issue(
    link_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = DecisionService(session)
    await service.unlink_issue(link_id)
    return MessageResponse(message="Decision-issue link removed")
