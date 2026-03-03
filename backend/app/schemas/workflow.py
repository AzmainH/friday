import enum
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class StatusCategory(str, enum.Enum):
    TO_DO = "to_do"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    BLOCKED = "blocked"


class WorkflowBase(BaseModel):
    name: str
    description: str | None = None
    is_default: bool = False


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_default: bool | None = None


class WorkflowResponse(WorkflowBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime


class WorkflowStatusCreate(BaseModel):
    name: str
    category: StatusCategory
    color: str = "#9e9e9e"
    sort_order: int = 0


class WorkflowStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: UUID
    name: str
    category: StatusCategory
    color: str
    sort_order: int
    created_at: datetime


class WorkflowTransitionCreate(BaseModel):
    from_status_id: UUID
    to_status_id: UUID
    name: str | None = None


class WorkflowTransitionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: UUID
    from_status_id: UUID
    to_status_id: UUID
    name: str | None


class WorkflowDetailResponse(WorkflowResponse):
    statuses: list[WorkflowStatusResponse] = []
    transitions: list[WorkflowTransitionResponse] = []
