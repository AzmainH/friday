from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.dashboard import (
    CustomDashboardCreate,
    CustomDashboardResponse,
    CustomDashboardUpdate,
    PersonalDashboardResponse,
    PortfolioDashboardResponse,
    ProjectDashboardResponse,
    ReportDataResponse,
    RunReportRequest,
    SavedReportCreate,
    SavedReportResponse,
    SavedReportUpdate,
)
from app.services.dashboard import DashboardService, ReportService

router = APIRouter(tags=["dashboards"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Personal Dashboard ───────────────────────────────────────────


@router.get(
    "/dashboards/personal",
    response_model=PersonalDashboardResponse,
)
async def get_personal_dashboard(
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DashboardService(session)
    return await service.get_personal_dashboard(user_id)


# ── Project Dashboard ────────────────────────────────────────────


@router.get(
    "/projects/{project_id}/dashboard",
    response_model=ProjectDashboardResponse,
)
async def get_project_dashboard(
    project_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = DashboardService(session)
    return await service.get_project_dashboard(project_id)


# ── Portfolio Dashboard ──────────────────────────────────────────


@router.get(
    "/workspaces/{workspace_id}/portfolio-dashboard",
    response_model=PortfolioDashboardResponse,
)
async def get_portfolio_dashboard(
    workspace_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = DashboardService(session)
    return await service.get_portfolio_dashboard(workspace_id)


# ── Custom Dashboards CRUD ───────────────────────────────────────


@router.get(
    "/dashboards",
    response_model=CursorPage[CustomDashboardResponse],
)
async def list_dashboards(
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DashboardService(session)
    result = await service.list_dashboards(
        user_id, cursor=cursor, limit=limit, include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/dashboards",
    response_model=CustomDashboardResponse,
    status_code=201,
)
async def create_dashboard(
    body: CustomDashboardCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DashboardService(session)
    data = body.model_dump()
    data["owner_id"] = user_id
    return await service.create_dashboard(data, created_by=user_id)


@router.get(
    "/dashboards/{dashboard_id}",
    response_model=CustomDashboardResponse,
)
async def get_dashboard(
    dashboard_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = DashboardService(session)
    return await service.get_dashboard(dashboard_id)


@router.patch(
    "/dashboards/{dashboard_id}",
    response_model=CustomDashboardResponse,
)
async def update_dashboard(
    dashboard_id: UUID,
    body: CustomDashboardUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DashboardService(session)
    return await service.update_dashboard(
        dashboard_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete(
    "/dashboards/{dashboard_id}",
    response_model=MessageResponse,
)
async def delete_dashboard(
    dashboard_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = DashboardService(session)
    await service.delete_dashboard(dashboard_id)
    return MessageResponse(message="Dashboard deleted")


# ── Saved Reports ────────────────────────────────────────────────


@router.get(
    "/reports",
    response_model=CursorPage[SavedReportResponse],
)
async def list_reports(
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReportService(session)
    result = await service.list_reports(
        user_id, cursor=cursor, limit=limit, include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/reports",
    response_model=SavedReportResponse,
    status_code=201,
)
async def create_report(
    body: SavedReportCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = ReportService(session)
    data = body.model_dump()
    data["owner_id"] = user_id
    return await service.create_report(data, created_by=user_id)


@router.post(
    "/reports/run",
    response_model=ReportDataResponse,
)
async def run_adhoc_report(
    body: RunReportRequest,
    session: AsyncSession = Depends(get_db),
):
    service = ReportService(session)
    return await service.run_report(body.report_type, body.config)


@router.get(
    "/reports/{report_id}/run",
    response_model=ReportDataResponse,
)
async def run_saved_report(
    report_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = ReportService(session)
    return await service.run_saved_report(report_id)
