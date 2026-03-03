from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IssueTypeBase(BaseModel):
    name: str
    description: str | None = None
    icon: str = "task"
    color: str = "#1976d2"
    hierarchy_level: int = 0
    is_subtask: bool = False
    sort_order: int = 0


class IssueTypeCreate(IssueTypeBase):
    pass


class IssueTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    hierarchy_level: int | None = None
    is_subtask: bool | None = None
    sort_order: int | None = None


class IssueTypeResponse(IssueTypeBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    created_at: datetime
