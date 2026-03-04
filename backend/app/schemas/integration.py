from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.integration import IntegrationType


# ---------- Integration ----------


class IntegrationCreate(BaseModel):
    type: IntegrationType
    name: str
    config_json: str = "{}"
    is_active: bool = True


class IntegrationUpdate(BaseModel):
    name: str | None = None
    config_json: str | None = None
    is_active: bool | None = None


class IntegrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    type: IntegrationType
    name: str
    config_json: str
    is_active: bool
    last_triggered_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    updated_by: UUID | None = None


# ---------- WebhookLog ----------


class WebhookLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    integration_id: UUID
    event_type: str
    payload_json: str
    status_code: int | None = None
    response_body: str | None = None
    success: bool
    created_at: datetime


# ---------- Test Webhook ----------


class TestWebhookRequest(BaseModel):
    event_type: str = "test"
    payload: dict | None = None


class TestWebhookResponse(BaseModel):
    success: bool
    status_code: int | None = None
    response_body: str | None = None


# ---------- Inbound Webhook ----------


class GitHubWebhookPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    action: str | None = None
    repository: dict | None = None


class SlackCommandPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    command: str | None = None
    text: str | None = None
    channel_id: str | None = None
    user_id: str | None = None
