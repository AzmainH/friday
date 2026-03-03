from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Decisions ----------


class DecisionCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "proposed"
    decided_date: date | None = None
    outcome: str | None = None
    rationale: str | None = None


class DecisionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    decided_date: date | None = None
    outcome: str | None = None
    rationale: str | None = None


class DecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    title: str
    description: str | None
    status: str
    decided_date: date | None
    outcome: str | None
    rationale: str | None
    created_at: datetime
    updated_at: datetime


# ---------- Decision Issue Links ----------


class DecisionIssueLinkCreate(BaseModel):
    issue_id: UUID


class DecisionIssueLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    issue_id: UUID
    created_at: datetime
