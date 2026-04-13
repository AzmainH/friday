"""Pydantic schemas for PDF report generation."""

from __future__ import annotations

from datetime import date
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ExecReportRequest(BaseModel):
    """Request body for generating an executive report."""

    model_config = ConfigDict(from_attributes=True)

    period: str = Field(
        default="week",
        description="Reporting period: week, month, or custom",
        pattern="^(week|month|custom)$",
    )
    start_date: date | None = Field(
        default=None,
        description="Custom period start date (required when period=custom)",
    )
    end_date: date | None = Field(
        default=None,
        description="Custom period end date (required when period=custom)",
    )


class RAGStatus(BaseModel):
    """Computed RAG (Red/Amber/Green) status for a project."""

    model_config = ConfigDict(from_attributes=True)

    status: Literal["green", "amber", "red"]
    rationale: str
    metrics: dict[str, Any] = Field(default_factory=dict)


class ExecReportMeta(BaseModel):
    """Metadata returned alongside an executive report."""

    model_config = ConfigDict(from_attributes=True)

    project_name: str
    generated_at: str
    period: str
    rag_status: RAGStatus
    pct_complete: float
    forecast_end: str


class PortfolioReportRequest(BaseModel):
    """Request body for generating a portfolio report."""

    model_config = ConfigDict(from_attributes=True)

    workspace_id: UUID
    period: str = Field(
        default="week",
        description="Reporting period: week, month, or custom",
        pattern="^(week|month|custom)$",
    )


class ReportScheduleRequest(BaseModel):
    """Request body for scheduling recurring report generation."""

    model_config = ConfigDict(from_attributes=True)

    cron_expression: str = Field(
        description="Cron expression for scheduling (e.g. '0 9 * * 1' for Monday 9am)",
    )
    enabled: bool = Field(default=True)
