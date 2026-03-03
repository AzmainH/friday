from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    key_prefix: str
    description: str | None = None
    status: str = "planning"
    lead_id: UUID | None = None
    start_date: date | None = None
    target_end_date: date | None = None
    rag_status: str = "none"


class ProjectCreate(ProjectBase):
    workspace_id: UUID


class ProjectUpdate(BaseModel):
    name: str | None = None
    key_prefix: str | None = None
    description: str | None = None
    status: str | None = None
    lead_id: UUID | None = None
    start_date: date | None = None
    target_end_date: date | None = None
    rag_status: str | None = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    archived_at: datetime | None = None
    archived_by: UUID | None = None
    created_at: datetime
    updated_at: datetime
