from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- SLA Policies ----------


class SLAPolicyCreate(BaseModel):
    name: str
    priority_filter: str | None = None
    response_hours: int | None = None
    resolution_hours: int | None = None
    is_active: bool = True


class SLAPolicyUpdate(BaseModel):
    name: str | None = None
    priority_filter: str | None = None
    response_hours: int | None = None
    resolution_hours: int | None = None
    is_active: bool | None = None


class SLAPolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    priority_filter: str | None
    response_hours: int | None
    resolution_hours: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ---------- Issue SLA Status ----------


class IssueSLAStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_id: UUID
    policy_id: UUID
    response_deadline: datetime | None
    resolution_deadline: datetime | None
    first_responded_at: datetime | None
    resolved_at: datetime | None
    response_breached: bool
    resolution_breached: bool
    created_at: datetime
    updated_at: datetime
