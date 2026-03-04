from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Sprint ----------


class SprintCreate(BaseModel):
    name: str
    goal: str | None = None
    start_date: date
    end_date: date
    status: str = "planning"


class SprintUpdate(BaseModel):
    name: str | None = None
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


class SprintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    goal: str | None
    start_date: date
    end_date: date
    status: str
    velocity: int | None
    created_at: datetime
    updated_at: datetime


class SprintBurndownResponse(BaseModel):
    sprint_id: UUID
    sprint_name: str
    start_date: date
    end_date: date
    total_points: int
    completed_points: int
    remaining_points: int
    total_issues: int
    completed_issues: int


# ---------- Sprint Issues ----------


class SprintAddIssuesRequest(BaseModel):
    issue_ids: list[UUID]
