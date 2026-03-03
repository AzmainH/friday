from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SearchResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entity_type: str
    entity_id: UUID
    title: str
    subtitle: str | None = None
    project_id: UUID | None = None
    project_name: str | None = None
    relevance: float | None = None
    highlight: str | None = None


class SearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    results: list[SearchResultItem]
    total_count: int
    facets: dict[str, int]


class SearchParams(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    query: str = Field(..., min_length=2)
    types: list[str] | None = None
    workspace_id: UUID | None = None
    project_id: UUID | None = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)
