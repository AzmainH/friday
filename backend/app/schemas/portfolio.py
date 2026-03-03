from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Releases ----------


class ReleaseCreate(BaseModel):
    name: str
    description: str | None = None
    status: str = "planning"
    release_date: date | None = None


class ReleaseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    release_date: date | None = None
    released_at: datetime | None = None


class ReleaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    name: str
    description: str | None
    status: str
    release_date: date | None
    released_at: datetime | None
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None


# ---------- Release Projects ----------


class ReleaseProjectCreate(BaseModel):
    project_id: UUID


class ReleaseProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    release_id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime


# ---------- Cross-Project Dependencies ----------


class CrossProjectDependencyCreate(BaseModel):
    source_project_id: UUID
    target_project_id: UUID
    source_issue_id: UUID | None = None
    target_issue_id: UUID | None = None
    dependency_type: str = "blocks"
    description: str | None = None


class CrossProjectDependencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_project_id: UUID
    target_project_id: UUID
    source_issue_id: UUID | None
    target_issue_id: UUID | None
    dependency_type: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None


# ---------- Portfolio Overview ----------


class PortfolioProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    name: str
    key_prefix: str
    status: str
    rag_status: str
    lead_id: UUID | None
    progress_pct: float
    issue_count: int
    overdue_count: int


class PortfolioOverviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    projects: list[PortfolioProjectResponse]
    total_budget: float
    total_spent: float


# ---------- Impact Analysis ----------


class AffectedProjectDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    dependency_type: str
    impact_description: str | None


class ImpactAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    affected_projects: list[AffectedProjectDetail]
