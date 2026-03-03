from uuid import UUID

from pydantic import BaseModel


class SearchRequest(BaseModel):
    q: str
    types: list[str] | None = None


class SearchResult(BaseModel):
    entity_type: str
    entity_id: UUID
    title: str
    snippet: str | None = None
    project_name: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total_count: int
