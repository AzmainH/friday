from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.core.errors import NotFoundException
from app.models.custom_field import CustomFieldDefinition, CustomFieldValue
from app.repositories.base import BaseRepository
from app.schemas.base import CursorPage, MessageResponse, PaginationMeta
from app.schemas.custom_field import (
    CustomFieldDefinitionCreate,
    CustomFieldDefinitionResponse,
    CustomFieldDefinitionUpdate,
    CustomFieldValueCreate,
    CustomFieldValueResponse,
)

router = APIRouter(tags=["custom-fields"])


def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )


# -- Definitions scoped under projects ------------------------------------


@router.get(
    "/projects/{project_id}/custom-fields",
    response_model=CursorPage[CustomFieldDefinitionResponse],
)
async def list_custom_field_definitions(
    project_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    include_count: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    repo = BaseRepository[CustomFieldDefinition](session, CustomFieldDefinition)
    result = await repo.get_multi(
        filters={"project_id": project_id},
        cursor=cursor,
        limit=limit,
        include_count=include_count,
    )
    return _build_page(result)


@router.post(
    "/projects/{project_id}/custom-fields",
    response_model=CustomFieldDefinitionResponse,
    status_code=201,
)
async def create_custom_field_definition(
    project_id: UUID,
    body: CustomFieldDefinitionCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    repo = BaseRepository[CustomFieldDefinition](session, CustomFieldDefinition)
    data = body.model_dump()
    data["project_id"] = project_id
    return await repo.create(data, created_by=user_id)


# -- Direct definition routes ---------------------------------------------


@router.put(
    "/custom-fields/{field_id}",
    response_model=CustomFieldDefinitionResponse,
)
async def update_custom_field_definition(
    field_id: UUID,
    body: CustomFieldDefinitionUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    repo = BaseRepository[CustomFieldDefinition](session, CustomFieldDefinition)
    updated = await repo.update(
        field_id, body.model_dump(exclude_unset=True), updated_by=user_id
    )
    if not updated:
        raise NotFoundException("Custom field definition not found")
    return updated


@router.delete("/custom-fields/{field_id}", response_model=MessageResponse)
async def delete_custom_field_definition(
    field_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    repo = BaseRepository[CustomFieldDefinition](session, CustomFieldDefinition)
    deleted = await repo.hard_delete(field_id)
    if not deleted:
        raise NotFoundException("Custom field definition not found")
    return MessageResponse(message="Custom field definition deleted")


# -- Values scoped under issues -------------------------------------------


@router.get(
    "/issues/{issue_id}/custom-field-values",
    response_model=list[CustomFieldValueResponse],
)
async def list_custom_field_values(
    issue_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    repo = BaseRepository[CustomFieldValue](session, CustomFieldValue)
    result = await repo.get_multi(filters={"issue_id": issue_id})
    return result["data"]


@router.put(
    "/issues/{issue_id}/custom-field-values",
    response_model=list[CustomFieldValueResponse],
)
async def set_custom_field_values(
    issue_id: UUID,
    body: list[CustomFieldValueCreate],
    session: AsyncSession = Depends(get_db),
):
    repo = BaseRepository[CustomFieldValue](session, CustomFieldValue)
    results: list[CustomFieldValue] = []
    for item in body:
        data = item.model_dump()
        data["issue_id"] = issue_id
        created = await repo.create(data)
        results.append(created)
    return results
