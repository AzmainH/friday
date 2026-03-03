from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    email: str
    display_name: str
    avatar_url: str | None = None
    timezone: str = "UTC"
    is_active: bool = True


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None
    timezone: str | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str
    avatar_url: str | None = None
