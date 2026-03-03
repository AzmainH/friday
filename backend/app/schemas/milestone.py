from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Milestones ----------


class MilestoneCreate(BaseModel):
    name: str
    description: str | None = None
    milestone_type: str
    status: str = "not_started"
    start_date: date | None = None
    due_date: date | None = None
    completed_date: date | None = None
    progress_pct: int = 0
    sort_order: int = 0


class MilestoneUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    milestone_type: str | None = None
    status: str | None = None
    start_date: date | None = None
    due_date: date | None = None
    completed_date: date | None = None
    progress_pct: int | None = None
    sort_order: int | None = None


class MilestoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    description: str | None
    milestone_type: str
    status: str
    start_date: date | None
    due_date: date | None
    completed_date: date | None
    progress_pct: int
    sort_order: int
    created_at: datetime
    updated_at: datetime


# ---------- Gate Approvals ----------


class GateApprovalCreate(BaseModel):
    notes: str | None = None


class GateApprovalDecision(BaseModel):
    status: str
    notes: str | None = None


class GateApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    milestone_id: UUID
    approver_id: UUID
    status: str
    notes: str | None
    decided_at: datetime | None
    created_at: datetime
    updated_at: datetime
