from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.search_global import SearchParams, SearchResponse
from app.services.search import SearchService

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResponse)
async def global_search(
    q: str = Query(..., min_length=2, description="Search query (min 2 characters)"),
    types: str | None = Query(
        None,
        description="Comma-separated entity types to search: issues,projects,comments",
    ),
    workspace_id: UUID | None = Query(None),
    project_id: UUID | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> SearchResponse:
    parsed_types: list[str] | None = None
    if types is not None:
        parsed_types = [t.strip() for t in types.split(",") if t.strip()]

    params = SearchParams(
        query=q,
        types=parsed_types,
        workspace_id=workspace_id,
        project_id=project_id,
        limit=limit,
        offset=offset,
    )

    service = SearchService(session)
    return await service.search(params)
