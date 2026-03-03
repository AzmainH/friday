from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TeamBase(BaseModel):
    name: str
    description: str | None = None


class TeamCreate(TeamBase):
    workspace_id: UUID


class TeamUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class TeamResponse(TeamBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime


class TeamMemberCreate(BaseModel):
    user_id: UUID


class TeamMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    team_id: UUID
    user_id: UUID
    created_at: datetime
