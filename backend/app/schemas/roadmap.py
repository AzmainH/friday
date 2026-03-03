from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- RoadmapPlan ----------


class RoadmapPlanCreate(BaseModel):
    name: str
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool = True


class RoadmapPlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class RoadmapPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    name: str
    description: str | None
    start_date: date | None
    end_date: date | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None


# ---------- RoadmapPlanProject ----------


class RoadmapPlanProjectCreate(BaseModel):
    project_id: UUID
    color: str = "#1976d2"
    sort_order: int = 0


class RoadmapPlanProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan_id: UUID
    project_id: UUID
    color: str
    sort_order: int
    created_at: datetime
    updated_at: datetime


# ---------- RoadmapScenario ----------


class RoadmapScenarioCreate(BaseModel):
    name: str
    description: str | None = None
    is_baseline: bool = False


class RoadmapScenarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan_id: UUID
    name: str
    description: str | None
    is_baseline: bool
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None


# ---------- RoadmapScenarioOverride ----------


class RoadmapScenarioOverrideCreate(BaseModel):
    issue_id: UUID
    override_start: date | None = None
    override_end: date | None = None
    override_assignee_id: UUID | None = None


class RoadmapScenarioOverrideResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scenario_id: UUID
    issue_id: UUID
    override_start: date | None
    override_end: date | None
    override_assignee_id: UUID | None
    created_at: datetime
    updated_at: datetime


# ---------- Timeline ----------


class RoadmapTimelineIssue(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str
    summary: str
    start: date | None
    end: date | None
    assignee_id: UUID | None


class RoadmapTimelineItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    project_name: str
    issues: list[RoadmapTimelineIssue]


class RoadmapTimelineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[RoadmapTimelineItem]
