from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RACIAssignmentCreate(BaseModel):
    issue_id: UUID | None = None
    user_id: UUID
    role_type: str


class RACIAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    issue_id: UUID | None = None
    user_id: UUID
    role_type: str
    created_at: datetime


class RACIMatrixRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    issue_id: UUID | None = None
    issue_key: str | None = None
    summary: str | None = None
    responsible: list[UUID] = []
    accountable: list[UUID] = []
    consulted: list[UUID] = []
    informed: list[UUID] = []


class RACIMatrixResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rows: list[RACIMatrixRow] = []


class RACIBulkUpdate(BaseModel):
    assignments: list[RACIAssignmentCreate]
