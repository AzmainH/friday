from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    scope_type: str
    is_system: bool
    description: str | None = None
    created_at: datetime
    updated_at: datetime


class RolePermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role_id: UUID
    permission: str
