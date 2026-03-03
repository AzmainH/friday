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
