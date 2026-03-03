from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.wiki import (
    WikiPageCommentCreate,
    WikiPageCommentResponse,
    WikiPageCreate,
    WikiPageResponse,
    WikiPageTreeNode,
    WikiPageUpdate,
    WikiPageVersionResponse,
    WikiSearchResult,
    WikiSpaceCreate,
    WikiSpaceResponse,
    WikiSpaceUpdate,
)
from app.services.wiki import WikiService

router = APIRouter(tags=["wiki"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# ── Spaces (scoped under workspaces) ─────────────────────────────


@router.get(
    "/workspaces/{workspace_id}/wiki-spaces",
    response_model=CursorPage[WikiSpaceResponse],
)
async def list_wiki_spaces(
    workspace_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    result = await service.list_spaces(
        workspace_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/workspaces/{workspace_id}/wiki-spaces",
    response_model=WikiSpaceResponse,
    status_code=201,
)
async def create_wiki_space(
    workspace_id: UUID,
    body: WikiSpaceCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WikiService(session)
    return await service.create_space(
        workspace_id, body.model_dump(), created_by=user_id
    )


# ── Spaces (direct) ──────────────────────────────────────────────


@router.get("/wiki-spaces/{space_id}", response_model=WikiSpaceResponse)
async def get_wiki_space(
    space_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    return await service.get_space(space_id)


@router.patch("/wiki-spaces/{space_id}", response_model=WikiSpaceResponse)
async def update_wiki_space(
    space_id: UUID,
    body: WikiSpaceUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WikiService(session)
    return await service.update_space(
        space_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/wiki-spaces/{space_id}", response_model=MessageResponse)
async def delete_wiki_space(
    space_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WikiService(session)
    await service.delete_space(space_id, deleted_by=user_id)
    return MessageResponse(message="Wiki space deleted")


# ── Page tree ─────────────────────────────────────────────────────


@router.get(
    "/wiki-spaces/{space_id}/tree",
    response_model=list[WikiPageTreeNode],
)
async def get_page_tree(
    space_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    return await service.get_tree(space_id)


# ── Pages (scoped under spaces) ──────────────────────────────────


@router.get(
    "/wiki-spaces/{space_id}/pages",
    response_model=CursorPage[WikiPageResponse],
)
async def list_wiki_pages(
    space_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    result = await service.list_pages(
        space_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/wiki-spaces/{space_id}/pages",
    response_model=WikiPageResponse,
    status_code=201,
)
async def create_wiki_page(
    space_id: UUID,
    body: WikiPageCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WikiService(session)
    return await service.create_page(
        space_id, body.model_dump(), created_by=user_id
    )


# ── Pages (direct) ───────────────────────────────────────────────


@router.get("/wiki-pages/{page_id}", response_model=WikiPageResponse)
async def get_wiki_page(
    page_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    return await service.get_page(page_id)


@router.patch("/wiki-pages/{page_id}", response_model=WikiPageResponse)
async def update_wiki_page(
    page_id: UUID,
    body: WikiPageUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WikiService(session)
    return await service.update_page(
        page_id,
        body.model_dump(exclude_unset=True),
        updated_by=user_id,
    )


@router.delete("/wiki-pages/{page_id}", response_model=MessageResponse)
async def delete_wiki_page(
    page_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WikiService(session)
    await service.delete_page(page_id, deleted_by=user_id)
    return MessageResponse(message="Wiki page deleted")


# ── Version history ───────────────────────────────────────────────


@router.get(
    "/wiki-pages/{page_id}/versions",
    response_model=CursorPage[WikiPageVersionResponse],
)
async def list_page_versions(
    page_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    result = await service.get_version_history(
        page_id,
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.get(
    "/wiki-pages/{page_id}/versions/{version_number}",
    response_model=WikiPageVersionResponse,
)
async def get_page_version(
    page_id: UUID,
    version_number: int,
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    return await service.get_version(page_id, version_number)


# ── Comments ──────────────────────────────────────────────────────


@router.get(
    "/wiki-pages/{page_id}/comments",
    response_model=list[WikiPageCommentResponse],
)
async def list_page_comments(
    page_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    return await service.list_comments_threaded(page_id)


@router.post(
    "/wiki-pages/{page_id}/comments",
    response_model=WikiPageCommentResponse,
    status_code=201,
)
async def create_page_comment(
    page_id: UUID,
    body: WikiPageCommentCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = WikiService(session)
    return await service.create_comment(
        page_id, user_id, body.model_dump()
    )


# ── Search ────────────────────────────────────────────────────────


@router.get(
    "/wiki-spaces/{space_id}/search",
    response_model=list[WikiSearchResult],
)
async def search_wiki(
    space_id: UUID,
    q: str = Query(..., min_length=1),
    session: AsyncSession = Depends(get_db),
):
    service = WikiService(session)
    return await service.search(q, space_id=space_id)
