from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StatusUpdateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    free_text: str = Field(..., min_length=1, max_length=5000)


class TaskMatch(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    task_summary: str
    matched_text: str
    percent_complete: int | None = None
    status: str | None = None
    revised_eta: date | None = None
    blockers: list[str] = []
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class ParsedStatusUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    matches: list[TaskMatch]
    raw_text: str
    project_id: UUID


class StatusConfirmRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    confirmed_updates: list[TaskMatch]


class StatusConfirmResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    updated_count: int
    variance_changes: list[dict]
