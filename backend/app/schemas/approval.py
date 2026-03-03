from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Approval Steps ----------


class ApprovalStepCreate(BaseModel):
    name: str
    step_order: int
    approver_id: UUID
    is_active: bool = True


class ApprovalStepUpdate(BaseModel):
    name: str | None = None
    step_order: int | None = None
    approver_id: UUID | None = None
    is_active: bool | None = None


class ApprovalStepResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    step_order: int
    approver_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ---------- Issue Approvals ----------


class IssueApprovalDecision(BaseModel):
    status: str
    notes: str | None = None


class IssueApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_id: UUID
    step_id: UUID
    approver_id: UUID
    status: str
    notes: str | None
    decided_at: datetime | None
    created_at: datetime
    updated_at: datetime
