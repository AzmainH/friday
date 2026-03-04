from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationResponse,
    IntegrationUpdate,
    TestWebhookRequest,
    TestWebhookResponse,
    WebhookLogResponse,
)
from app.services.integration import IntegrationService

router = APIRouter(tags=["integrations"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Project-scoped Integration CRUD ─────────────────────────────


@router.get(
    "/projects/{project_id}/integrations",
    response_model=CursorPage[IntegrationResponse],
)
async def list_integrations(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = IntegrationService(session)
    result = await service.list_integrations(
        project_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/integrations",
    response_model=IntegrationResponse,
    status_code=201,
)
async def create_integration(
    project_id: UUID,
    body: IntegrationCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IntegrationService(session)
    data = body.model_dump()
    return await service.create_integration(project_id, data, created_by=user_id)


# ── Integration by ID ───────────────────────────────────────────


@router.get(
    "/integrations/{integration_id}",
    response_model=IntegrationResponse,
)
async def get_integration(
    integration_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = IntegrationService(session)
    return await service.get_integration(integration_id)


@router.patch(
    "/integrations/{integration_id}",
    response_model=IntegrationResponse,
)
async def update_integration(
    integration_id: UUID,
    body: IntegrationUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IntegrationService(session)
    data = body.model_dump(exclude_unset=True)
    return await service.update_integration(
        integration_id, data, updated_by=user_id
    )


@router.delete(
    "/integrations/{integration_id}",
    response_model=MessageResponse,
)
async def delete_integration(
    integration_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IntegrationService(session)
    await service.delete_integration(integration_id, deleted_by=user_id)
    return MessageResponse(message="Integration deleted")


# ── Webhook Delivery Logs ────────────────────────────────────────


@router.get(
    "/integrations/{integration_id}/logs",
    response_model=CursorPage[WebhookLogResponse],
)
async def list_webhook_logs(
    integration_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = IntegrationService(session)
    result = await service.list_logs(
        integration_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


# ── Test Webhook ─────────────────────────────────────────────────


@router.post(
    "/integrations/{integration_id}/test",
    response_model=TestWebhookResponse,
)
async def test_webhook(
    integration_id: UUID,
    body: TestWebhookRequest | None = None,
    session: AsyncSession = Depends(get_db),
):
    service = IntegrationService(session)
    event_type = body.event_type if body else "test"
    payload = body.payload if body else None
    result = await service.test_webhook(integration_id, event_type, payload)
    return TestWebhookResponse(**result)
