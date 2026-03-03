from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Template CRUD schemas ───────────────────────────────────────


class ProjectTemplateCreate(BaseModel):
    name: str = Field(..., max_length=200)
    description: str | None = None
    icon: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=7)
    template_data: dict[str, Any] = Field(default_factory=dict)


class ProjectTemplateUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    description: str | None = None
    icon: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=7)
    template_data: dict[str, Any] | None = None


class ProjectTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    is_system: bool
    template_data: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    updated_by: UUID | None = None


# ── Wizard schemas ──────────────────────────────────────────────


class ProjectWizardRequest(BaseModel):
    workspace_id: UUID | None = None
    name: str = Field(..., max_length=255)
    key_prefix: str = Field(..., max_length=10)
    template_id: str | None = None
    description: str | None = None
    lead_id: UUID | None = None


class ProjectWizardResponse(BaseModel):
    project_id: UUID
    message: str
