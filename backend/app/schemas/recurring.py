from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Recurring Rules ----------


class RecurringRuleCreate(BaseModel):
    name: str
    frequency: str
    day_of_week: int | None = None
    day_of_month: int | None = None
    template_summary: str
    template_description: str | None = None
    template_issue_type_id: UUID | None = None
    template_assignee_id: UUID | None = None
    template_priority: str = "medium"
    is_active: bool = True
    next_due_at: datetime | None = None


class RecurringRuleUpdate(BaseModel):
    name: str | None = None
    frequency: str | None = None
    day_of_week: int | None = None
    day_of_month: int | None = None
    template_summary: str | None = None
    template_description: str | None = None
    template_issue_type_id: UUID | None = None
    template_assignee_id: UUID | None = None
    template_priority: str | None = None
    is_active: bool | None = None
    next_due_at: datetime | None = None


class RecurringRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    frequency: str
    day_of_week: int | None
    day_of_month: int | None
    template_summary: str
    template_description: str | None
    template_issue_type_id: UUID | None
    template_assignee_id: UUID | None
    template_priority: str
    is_active: bool
    last_created_at: datetime | None
    next_due_at: datetime | None
    created_at: datetime
    updated_at: datetime
