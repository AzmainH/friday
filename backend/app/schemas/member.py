from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# --- Org members ---


class OrgMemberCreate(BaseModel):
    org_id: UUID
    user_id: UUID
    role_id: UUID


class OrgMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    user_id: UUID
    role_id: UUID
    created_at: datetime


# --- Workspace members ---


class WorkspaceMemberCreate(BaseModel):
    workspace_id: UUID
    user_id: UUID
    role_id: UUID


class WorkspaceMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    user_id: UUID
    role_id: UUID
    created_at: datetime


# --- Project members ---


class ProjectMemberCreate(BaseModel):
    project_id: UUID
    user_id: UUID
    role_id: UUID
    capacity_pct: float | None = None
    hours_per_week: float | None = None


class ProjectMemberUpdate(BaseModel):
    role_id: UUID | None = None
    capacity_pct: float | None = None
    hours_per_week: float | None = None


class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID
    role_id: UUID
    capacity_pct: float | None = None
    hours_per_week: float | None = None
    created_at: datetime
