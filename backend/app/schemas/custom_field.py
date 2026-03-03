from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CustomFieldDefinitionBase(BaseModel):
    name: str
    field_type: str
    description: str | None = None
    options_json: dict | None = None
    validation_json: dict | None = None
    default_value: str | None = None
    sort_order: int = 0
    is_required: bool = False


class CustomFieldDefinitionCreate(CustomFieldDefinitionBase):
    pass


class CustomFieldDefinitionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    options_json: dict | None = None
    validation_json: dict | None = None
    default_value: str | None = None
    sort_order: int | None = None
    is_required: bool | None = None


class CustomFieldDefinitionResponse(CustomFieldDefinitionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime


class CustomFieldValueCreate(BaseModel):
    field_definition_id: UUID
    value_text: str | None = None
    value_number: float | None = None
    value_date: date | None = None
    value_json: Any | None = None


class CustomFieldValueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_id: UUID
    field_definition_id: UUID
    value_text: str | None
    value_number: float | None
    value_date: date | None
    value_json: Any | None
    created_at: datetime
    updated_at: datetime
