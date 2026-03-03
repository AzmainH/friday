from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.intake import (
    IntakeFormCreate,
    IntakeFormResponse,
    IntakeFormUpdate,
    IntakeSubmissionCreate,
    IntakeSubmissionResponse,
    IntakeSubmissionReview,
)
from app.services.intake import IntakeService

router = APIRouter(tags=["intake"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Scoped under projects ──────────────────────────────────────


@router.get(
    "/projects/{project_id}/intake-forms",
    response_model=CursorPage[IntakeFormResponse],
)
async def list_intake_forms(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = IntakeService(session)
    result = await service.list_forms_by_project(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/intake-forms",
    response_model=IntakeFormResponse,
    status_code=201,
)
async def create_intake_form(
    project_id: UUID,
    body: IntakeFormCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IntakeService(session)
    data = body.model_dump()
    return await service.create_form(project_id, data, created_by=user_id)


# ── Direct intake-form routes ──────────────────────────────────


@router.get("/intake-forms/{form_id}", response_model=IntakeFormResponse)
async def get_intake_form(
    form_id: UUID,
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = IntakeService(session)
    return await service.get_form(form_id)


@router.patch("/intake-forms/{form_id}", response_model=IntakeFormResponse)
async def update_intake_form(
    form_id: UUID,
    body: IntakeFormUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IntakeService(session)
    return await service.update_form(
        form_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/intake-forms/{form_id}", response_model=MessageResponse)
async def delete_intake_form(
    form_id: UUID,
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = IntakeService(session)
    await service.delete_form(form_id)
    return MessageResponse(message="Intake form deleted")


# ── Public submission (no auth required) ────────────────────────


@router.post(
    "/intake/{public_slug}/submit",
    response_model=IntakeSubmissionResponse,
    status_code=201,
)
async def submit_intake_public(
    public_slug: str,
    body: IntakeSubmissionCreate,
    session: AsyncSession = Depends(get_db),
):
    service = IntakeService(session)
    data = body.model_dump()
    return await service.submit_public(public_slug, data)


# ── Submissions management ──────────────────────────────────────


@router.get(
    "/intake-forms/{form_id}/submissions",
    response_model=CursorPage[IntakeSubmissionResponse],
)
async def list_submissions(
    form_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
):
    service = IntakeService(session)
    result = await service.list_submissions(
        form_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.patch(
    "/intake-submissions/{submission_id}/review",
    response_model=IntakeSubmissionResponse,
)
async def review_submission(
    submission_id: UUID,
    body: IntakeSubmissionReview,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IntakeService(session)
    return await service.review_submission(
        submission_id,
        body.status,
        reviewed_by=user_id,
        notes=body.notes,
    )
