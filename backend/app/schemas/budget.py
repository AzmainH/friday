from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.budget import CostCategory


# ---------- Project Budget ----------


class ProjectBudgetCreate(BaseModel):
    total_budget: float
    currency: str = "USD"
    notes: str | None = None


class ProjectBudgetUpdate(BaseModel):
    total_budget: float | None = None
    currency: str | None = None
    notes: str | None = None


class ProjectBudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    total_budget: float
    currency: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    updated_by: UUID | None = None


# ---------- Cost Entry ----------


class CostEntryCreate(BaseModel):
    issue_id: UUID | None = None
    category: CostCategory
    amount: float
    description: str | None = None
    entry_date: date


class CostEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    issue_id: UUID | None
    category: CostCategory
    amount: float
    description: str | None
    entry_date: date
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    updated_by: UUID | None = None


# ---------- Budget Summary ----------


class MonthlyBurn(BaseModel):
    month: str
    amount: float


class BudgetSummaryResponse(BaseModel):
    total_budget: float
    total_spent: float
    remaining: float
    percent_used: float
    by_category: dict[str, float]
    monthly_burn: list[MonthlyBurn]
