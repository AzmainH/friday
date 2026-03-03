from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ImportRequest(BaseModel):
    column_mapping: dict[str, str] = Field(
        ...,
        description=(
            "Mapping of CSV column names to issue field names. "
            "Example: {'Title': 'summary', 'Description': 'description'}"
        ),
    )


class ImportPreviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    columns: list[str]
    sample_rows: list[dict[str, Any]]


class ExportRequest(BaseModel):
    format: str = Field(
        default="csv",
        pattern="^(csv)$",
        description="Export format. Currently only 'csv' is supported.",
    )
    filters: dict[str, Any] | None = Field(
        default=None,
        description="Optional filters to apply when exporting issues.",
    )


class ImportExportTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    status: str
    message: str
