from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------- Automation Rules ----------


class AutomationRuleCreate(BaseModel):
    name: str = Field(..., max_length=200)
    is_enabled: bool = True
    trigger_type: str
    trigger_config: dict = Field(default_factory=dict)
    condition_config: dict | None = None
    action_type: str
    action_config: dict = Field(default_factory=dict)


class AutomationRuleUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    is_enabled: bool | None = None
    trigger_type: str | None = None
    trigger_config: dict | None = None
    condition_config: dict | None = None
    action_type: str | None = None
    action_config: dict | None = None


class AutomationRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    is_enabled: bool
    trigger_type: str
    trigger_config: dict
    condition_config: dict | None
    action_type: str
    action_config: dict
    execution_count: int
    last_executed_at: datetime | None
    created_at: datetime
    updated_at: datetime


# ---------- Execution Logs ----------


class AutomationExecutionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rule_id: UUID
    issue_id: UUID | None
    trigger_data: dict | None
    success: bool
    error_message: str | None
    executed_at: datetime
    created_at: datetime


# ---------- Test / Dry-run ----------


class AutomationTestRequest(BaseModel):
    issue_id: UUID


class AutomationTestResponse(BaseModel):
    would_match: bool
    actions: list[dict]
