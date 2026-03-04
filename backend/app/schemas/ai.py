from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AITaskRequest(BaseModel):
    project_id: UUID
    task_type: str = Field(
        ...,
        pattern="^(smart_schedule|risk_prediction|summarize)$",
        description="One of: smart_schedule, risk_prediction, summarize",
    )


class AITaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    status: str
    message: str


class AISummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    summary: str
    key_points: list[str]


class AIRiskItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    description: str
    severity: str
    probability: float
    mitigation: str


class AIRiskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    risks: list[AIRiskItem]


class AIChatRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message: str
    context_type: str | None = None  # "project", "issue"
    context_id: str | None = None


class AIChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    response: str
    project_id: str
