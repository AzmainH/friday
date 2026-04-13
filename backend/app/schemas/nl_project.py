from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Request Schemas ----------


class ProjectPlanRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    description: str
    constraints: str | None = None


class PlanRefinementRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: UUID
    corrections: str


class BaselineLockRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    name: str = "Initial AI Baseline"


class ApplyPlanRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan: "ProjectPlanResponse"
    workspace_id: UUID
    project_name: str


# ---------- Response Schemas ----------


class ProjectPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    summary: str
    deliverables: list[dict]
    workflows: list[dict]
    tasks: list[dict]
    roles: list[dict]
    timeline: dict


class BaselineLockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    baseline_id: UUID
    snapshot_count: int


# Rebuild forward reference for ApplyPlanRequest
ApplyPlanRequest.model_rebuild()
