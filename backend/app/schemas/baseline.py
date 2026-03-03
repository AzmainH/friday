from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Baseline ----------


class BaselineCreate(BaseModel):
    name: str
    description: str | None = None


class BaselineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    description: str | None = None
    snapshot_date: datetime
    created_at: datetime
    snapshot_count: int | None = None


# ---------- Baseline Snapshot ----------


class BaselineSnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    baseline_id: UUID
    issue_id: UUID
    planned_start: date | None = None
    planned_end: date | None = None
    estimated_hours: float | None = None
    story_points: int | None = None
    status_id: UUID | None = None


# ---------- Baseline with Snapshots ----------


class BaselineDetailResponse(BaselineResponse):
    snapshots: list[BaselineSnapshotResponse] = []


# ---------- Baseline Compare ----------


class BaselineVarianceItem(BaseModel):
    issue_id: UUID
    baseline_planned_start: date | None = None
    baseline_planned_end: date | None = None
    baseline_estimated_hours: float | None = None
    baseline_story_points: int | None = None
    baseline_status_id: UUID | None = None
    current_planned_start: date | None = None
    current_planned_end: date | None = None
    current_estimated_hours: float | None = None
    current_story_points: int | None = None
    current_status_id: UUID | None = None
    start_date_diff_days: int | None = None
    end_date_diff_days: int | None = None
    hours_diff: float | None = None
    story_points_diff: int | None = None


class BaselineCompareResponse(BaseModel):
    baseline_id: UUID
    baseline_name: str
    variances: list[BaselineVarianceItem] = []
