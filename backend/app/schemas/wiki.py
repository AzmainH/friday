from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------- WikiSpace ----------


class WikiSpaceCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    is_active: bool = True


class WikiSpaceUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    is_active: bool | None = None


class WikiSpaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    updated_by: UUID | None = None


# ---------- WikiPage ----------


class WikiPageCreate(BaseModel):
    title: str
    content: str | None = None
    parent_id: UUID | None = None
    sort_order: int = 0


class WikiPageUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    expected_version: int
    parent_id: UUID | None = None
    sort_order: int | None = None


class WikiPageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    space_id: UUID
    parent_id: UUID | None
    title: str
    slug: str
    content: str | None
    version: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    updated_by: UUID | None = None


class WikiPageTreeNode(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    slug: str
    sort_order: int
    children: list[WikiPageTreeNode] = []


# ---------- WikiPageVersion ----------


class WikiPageVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    page_id: UUID
    version_number: int
    title: str
    content: str | None
    edited_by: UUID | None
    change_summary: str | None
    created_at: datetime


# ---------- WikiPageComment ----------


class WikiPageCommentCreate(BaseModel):
    content: str
    parent_comment_id: UUID | None = None


class WikiPageCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    page_id: UUID
    author_id: UUID
    parent_comment_id: UUID | None
    content: str
    created_at: datetime
    replies: list[WikiPageCommentResponse] = []


# ---------- WikiSearch ----------


class WikiSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page_id: UUID
    title: str
    slug: str
    space_id: UUID
    highlight: str | None = None
    relevance: float | None = None
