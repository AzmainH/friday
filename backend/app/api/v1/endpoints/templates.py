from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, PaginationMeta
from app.schemas.template import (
    ProjectTemplateCreate,
    ProjectTemplateResponse,
    ProjectWizardRequest,
    ProjectWizardResponse,
)
from app.services.template import TemplateService

router = APIRouter(tags=["templates"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Template endpoints ──────────────────────────────────────────


@router.get(
    "/templates",
    response_model=CursorPage[ProjectTemplateResponse],
)
async def list_templates(
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = TemplateService(session)
    result = await service.list_templates(
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.get(
    "/templates/{template_id}",
    response_model=ProjectTemplateResponse,
)
async def get_template(
    template_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = TemplateService(session)
    return await service.get_template(template_id)


@router.post(
    "/templates",
    response_model=ProjectTemplateResponse,
    status_code=201,
)
async def create_template(
    body: ProjectTemplateCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = TemplateService(session)
    return await service.create_template(
        body.model_dump(), created_by=user_id
    )


# ── Wizard endpoint ─────────────────────────────────────────────


@router.post(
    "/wizard/create-project",
    response_model=ProjectWizardResponse,
    status_code=201,
)
async def create_project_from_wizard(
    body: ProjectWizardRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = TemplateService(session)
    project = await service.create_project_from_wizard(
        body.model_dump(), user_id
    )
    return ProjectWizardResponse(
        project_id=project.id,
        message="Project created successfully",
    )
