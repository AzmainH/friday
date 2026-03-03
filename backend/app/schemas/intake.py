from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Intake Forms ----------


class IntakeFormCreate(BaseModel):
    name: str
    description: str | None = None
    fields_schema: list[dict[str, Any]] = []
    is_active: bool = True
    public_slug: str | None = None


class IntakeFormUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    fields_schema: list[dict[str, Any]] | None = None
    is_active: bool | None = None
    public_slug: str | None = None


class IntakeFormResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    description: str | None
    fields_schema: list[dict[str, Any]]
    is_active: bool
    public_slug: str | None
    created_at: datetime
    updated_at: datetime


# ---------- Intake Submissions ----------


class IntakeSubmissionCreate(BaseModel):
    data_json: dict[str, Any]
    submitted_by_email: str | None = None
    submitted_by_name: str | None = None


class IntakeSubmissionReview(BaseModel):
    status: str
    notes: str | None = None


class IntakeSubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    form_id: UUID
    submitted_by_email: str | None
    submitted_by_name: str | None
    data_json: dict[str, Any]
    status: str
    created_issue_id: UUID | None
    reviewed_by: UUID | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
