"""Pydantic schemas for AI Re-forecasting Engine endpoints."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AdjustedTask(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    task_summary: str
    old_planned_start: date | None
    old_planned_end: date | None
    new_planned_start: date | None
    new_planned_end: date | None
    variance_days: int


class ReforecastResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    adjusted_tasks: list[AdjustedTask]
    total_tasks_affected: int


class CriticalPath(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    path: list[UUID]
    total_duration_days: int
    tasks: list[dict]


class VarianceAlert(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    task_summary: str
    alert_type: str
    severity: str
    message: str
    variance_days: int | None = None
