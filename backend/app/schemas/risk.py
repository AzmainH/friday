from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Risks ----------


class RiskCreate(BaseModel):
    title: str
    description: str | None = None
    category: str = "technical"
    probability: str = "medium"
    impact: str = "medium"
    status: str = "identified"
    owner_id: UUID | None = None
    mitigation_plan: str | None = None
    contingency_plan: str | None = None
    trigger_conditions: str | None = None
    due_date: date | None = None


class RiskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    probability: str | None = None
    impact: str | None = None
    status: str | None = None
    owner_id: UUID | None = None
    mitigation_plan: str | None = None
    contingency_plan: str | None = None
    trigger_conditions: str | None = None
    due_date: date | None = None
    resolved_at: datetime | None = None


class RiskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    title: str
    description: str | None
    category: str
    probability: str
    impact: str
    risk_score: int
    status: str
    owner_id: UUID | None
    mitigation_plan: str | None
    contingency_plan: str | None
    trigger_conditions: str | None
    due_date: date | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


# ---------- Risk Matrix ----------


class RiskMatrixCell(BaseModel):
    probability: str
    impact: str
    probability_score: int
    impact_score: int
    count: int


class RiskMatrixResponse(BaseModel):
    cells: list[RiskMatrixCell]


# ---------- Risk Summary ----------


class RiskSummaryResponse(BaseModel):
    total: int
    average_score: float
    by_status: dict[str, int]
    by_category: dict[str, int]


# ---------- Risk Responses (actions) ----------


class RiskResponseCreate(BaseModel):
    response_type: str = "mitigate"
    description: str | None = None
    status: str = "planned"
    assigned_to: UUID | None = None


class RiskResponseUpdate(BaseModel):
    response_type: str | None = None
    description: str | None = None
    status: str | None = None
    assigned_to: UUID | None = None


class RiskResponseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    risk_id: UUID
    response_type: str
    description: str | None
    status: str
    assigned_to: UUID | None
    created_at: datetime
    updated_at: datetime
