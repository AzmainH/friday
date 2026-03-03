from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.dashboard import DashboardScope


# ── Custom Dashboard ─────────────────────────────────────────────


class CustomDashboardCreate(BaseModel):
    name: str
    scope: DashboardScope = DashboardScope.PERSONAL
    scope_id: UUID | None = None
    layout_json: dict[str, Any] = {}
    widgets_json: list[dict[str, Any]] = []
    is_shared: bool = False


class CustomDashboardUpdate(BaseModel):
    name: str | None = None
    scope: DashboardScope | None = None
    scope_id: UUID | None = None
    layout_json: dict[str, Any] | None = None
    widgets_json: list[dict[str, Any]] | None = None
    is_shared: bool | None = None


class CustomDashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    name: str
    scope: str
    scope_id: UUID | None = None
    layout_json: dict[str, Any]
    widgets_json: list[dict[str, Any]]
    is_shared: bool
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    updated_by: UUID | None = None


# ── Saved Report ─────────────────────────────────────────────────


class SavedReportCreate(BaseModel):
    name: str
    report_type: str
    config_json: dict[str, Any] = {}
    project_id: UUID | None = None


class SavedReportUpdate(BaseModel):
    name: str | None = None
    report_type: str | None = None
    config_json: dict[str, Any] | None = None
    project_id: UUID | None = None


class SavedReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    name: str
    report_type: str
    config_json: dict[str, Any]
    project_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    updated_by: UUID | None = None


# ── Dashboard Data Responses ─────────────────────────────────────


class PersonalDashboardResponse(BaseModel):
    assigned_to_me: int
    overdue: int
    due_this_week: int
    recent_activity: list[dict[str, Any]]
    my_projects: list[dict[str, Any]]


class ProjectDashboardResponse(BaseModel):
    issue_counts_by_status: dict[str, int]
    issue_counts_by_priority: dict[str, int]
    progress_pct: float
    overdue_count: int
    burndown_data: list[dict[str, Any]]
    velocity_data: list[dict[str, Any]]


class PortfolioDashboardResponse(BaseModel):
    projects_by_status: dict[str, int]
    projects_by_rag: dict[str, int]
    total_issues: int
    completion_rate: float


class ReportDataResponse(BaseModel):
    report_type: str
    data: list[dict[str, Any]]
    generated_at: str


# ── Ad-hoc Report Request ───────────────────────────────────────


class RunReportRequest(BaseModel):
    report_type: str
    config: dict[str, Any] = {}
