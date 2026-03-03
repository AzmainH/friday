from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.issue_type import IssueTypeResponse
from app.schemas.user import UserBrief
from app.schemas.workflow import WorkflowStatusResponse


class IssueBase(BaseModel):
    summary: str
    description: str | None = None
    priority: str = "medium"
    rag_status: str = "none"


class IssueCreate(IssueBase):
    issue_type_id: UUID
    assignee_id: UUID | None = None
    parent_issue_id: UUID | None = None
    milestone_id: UUID | None = None
    estimated_hours: float | None = None
    story_points: int | None = None
    planned_start: date | None = None
    planned_end: date | None = None
    label_ids: list[UUID] = []
    component_ids: list[UUID] = []


class IssueUpdate(BaseModel):
    summary: str | None = None
    description: str | None = None
    priority: str | None = None
    assignee_id: UUID | None = None
    issue_type_id: UUID | None = None
    status_id: UUID | None = None
    parent_issue_id: UUID | None = None
    milestone_id: UUID | None = None
    estimated_hours: float | None = None
    story_points: int | None = None
    rag_status: str | None = None
    planned_start: date | None = None
    planned_end: date | None = None
    sort_order: float | None = None
    label_ids: list[UUID] | None = None
    component_ids: list[UUID] | None = None


class IssueResponse(IssueBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    issue_key: str
    issue_type_id: UUID
    status_id: UUID
    assignee_id: UUID | None
    reporter_id: UUID | None
    parent_issue_id: UUID | None
    milestone_id: UUID | None
    estimated_hours: float | None
    actual_hours: float | None
    story_points: int | None
    percent_complete: int
    planned_start: date | None
    planned_end: date | None
    actual_start: date | None
    actual_end: date | None
    sort_order: float
    created_at: datetime
    updated_at: datetime

    status: WorkflowStatusResponse | None = None
    issue_type: IssueTypeResponse | None = None
    assignee: UserBrief | None = None


class IssueBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_key: str
    summary: str
    priority: str
    status: WorkflowStatusResponse | None = None
    assignee: UserBrief | None = None


class IssueBulkUpdateRequest(BaseModel):
    issue_ids: list[UUID]
    update: IssueUpdate


class IssueBulkResponse(BaseModel):
    updated_count: int
    errors: list[str] | None = None
