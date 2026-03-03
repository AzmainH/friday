from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------- Stakeholders ----------


class StakeholderCreate(BaseModel):
    name: str
    role: str | None = None
    email: str | None = None
    organization_name: str | None = None
    interest_level: int = Field(..., ge=1, le=5)
    influence_level: int = Field(..., ge=1, le=5)
    engagement_strategy: str | None = None
    notes: str | None = None


class StakeholderUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    email: str | None = None
    organization_name: str | None = None
    interest_level: int | None = Field(None, ge=1, le=5)
    influence_level: int | None = Field(None, ge=1, le=5)
    engagement_strategy: str | None = None
    notes: str | None = None


class StakeholderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    role: str | None
    email: str | None
    organization_name: str | None
    interest_level: int
    influence_level: int
    engagement_strategy: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


# ---------- Stakeholder Matrix ----------


class StakeholderMatrixEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    interest_level: int
    influence_level: int
    quadrant: str


class StakeholderMatrixResponse(BaseModel):
    data: list[StakeholderMatrixEntry]
