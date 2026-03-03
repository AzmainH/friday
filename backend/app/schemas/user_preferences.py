from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserPreferencesUpdate(BaseModel):
    default_view: str | None = None
    sidebar_state: dict | None = None
    column_layouts: dict | None = None
    notification_settings: dict | None = None
    date_format: str | None = None
    timezone: str | None = None


class UserPreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    default_view: str
    sidebar_state: dict | None = None
    column_layouts: dict | None = None
    notification_settings: dict | None = None
    date_format: str
    timezone: str
