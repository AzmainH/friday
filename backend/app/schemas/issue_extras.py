from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- Labels ----------

class LabelCreate(BaseModel):
    name: str
    color: str = "#1976d2"
    description: str | None = None


class LabelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    color: str
    description: str | None = None
    created_at: datetime


# ---------- Components ----------

class ComponentCreate(BaseModel):
    name: str
    description: str | None = None
    lead_id: UUID | None = None


class ComponentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    lead_id: UUID | None = None


class ComponentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    description: str | None
    lead_id: UUID | None
    created_at: datetime
    updated_at: datetime


# ---------- Versions ----------

class VersionCreate(BaseModel):
    name: str
    description: str | None = None
    start_date: date | None = None
    release_date: date | None = None
    status: str = "unreleased"


class VersionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_date: date | None = None
    release_date: date | None = None
    status: str | None = None


class VersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    description: str | None
    start_date: date | None
    release_date: date | None
    status: str
    created_at: datetime
    updated_at: datetime


# ---------- Time Entries ----------

class TimeEntryCreate(BaseModel):
    hours: float
    date: date
    description: str | None = None


class TimeEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_id: UUID
    user_id: UUID
    hours: float
    date: date
    description: str | None
    created_at: datetime


# ---------- Saved Views ----------

class SavedViewCreate(BaseModel):
    name: str
    description: str | None = None
    filters_json: dict | None = None
    columns_json: list[str] | None = None
    sort_json: dict | None = None
    is_shared: bool = False


class SavedViewUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    filters_json: dict | None = None
    columns_json: list[str] | None = None
    sort_json: dict | None = None
    is_shared: bool | None = None


class SavedViewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID
    name: str
    description: str | None
    filters_json: dict | None
    columns_json: list[str] | None
    sort_json: dict | None
    is_shared: bool
    created_at: datetime
    updated_at: datetime


# ---------- Favorites ----------

class FavoriteCreate(BaseModel):
    entity_type: str
    entity_id: UUID


class FavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    entity_type: str
    entity_id: UUID
    created_at: datetime


# ---------- Notifications ----------

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    type: str
    title: str
    body: str | None
    entity_type: str | None
    entity_id: UUID | None
    project_id: UUID | None
    is_read: bool
    created_at: datetime


# ---------- Task Status ----------

class TaskStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    status: str
    progress: int = 0
    result_json: Any | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Uploads ----------

class UploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    content_type: str
    size_bytes: int
    storage_path: str
    uploaded_by: UUID
    created_at: datetime
