from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    status: str
    message: str


class ResourceMatchPreview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_name: str
    matched_user_id: UUID | None = None
    matched_display_name: str | None = None
    confidence: float = 0.0


class TaskPreview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    wbs: str
    name: str
    status: str
    hierarchy_level: int
    start_date: date | None = None
    end_date: date | None = None
    resource_names: list[str] = []
    predecessor_count: int = 0


class MilestonePreview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    milestone_type: str
    start_date: date | None = None
    due_date: date | None = None


class DocumentAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_name: str | None = None
    project_description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    task_count: int = 0
    milestone_count: int = 0
    resource_count: int = 0
    statuses_found: list[str] = []
    hierarchy_levels: int = 0
    resources: list[ResourceMatchPreview] = []
    milestones: list[MilestonePreview] = []
    tasks_preview: list[TaskPreview] = []
    total_tasks: int = 0
    warnings: list[str] = []


class DocumentProjectCreateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    analysis_task_id: UUID
    mode: str = Field(pattern="^(new|existing)$")
    project_name: str | None = None
    key_prefix: str | None = None
    description: str | None = None
    workspace_id: UUID | None = None
    existing_project_id: UUID | None = None
    resource_mapping: dict[str, UUID | None] = {}
    status_mapping: dict[str, str] = {}
    create_milestones: bool = True
    selected_phases: list[str] | None = None


class DocumentImportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    status: str
    message: str
