"""Pydantic schemas for resource capacity planning endpoints."""

from pydantic import BaseModel, ConfigDict


# ── Capacity ──────────────────────────────────────────────────────


class CapacityMember(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    display_name: str
    email: str
    weekly_capacity_hours: float
    total_capacity_hours: float


class TeamCapacityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    members: list[CapacityMember]
    weeks: int
    hours_per_week: int


# ── Allocation ────────────────────────────────────────────────────


class ProjectAllocation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: str
    allocated_hours: float
    issue_count: int


class MemberAllocation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    total_allocated_hours: float
    projects: list[ProjectAllocation]


class TeamAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    allocations: list[MemberAllocation]
    weeks: int


# ── Utilization ───────────────────────────────────────────────────


class UtilizationMember(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    display_name: str
    capacity_hours: float
    allocated_hours: float
    available_hours: float
    utilization_percent: float
    status: str  # "over" | "optimal" | "under"


class UtilizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    utilization: list[UtilizationMember]
    weeks: int
