import enum
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserBrief


class IssueLinkType(str, enum.Enum):
    BLOCKS = "blocks"
    IS_BLOCKED_BY = "is_blocked_by"
    RELATES_TO = "relates_to"
    DUPLICATES = "duplicates"
    IS_DUPLICATED_BY = "is_duplicated_by"
    DEPENDS_ON = "depends_on"
    IS_DEPENDENCY_OF = "is_dependency_of"


class IssueLinkCreate(BaseModel):
    target_issue_id: UUID
    link_type: IssueLinkType


class IssueBriefRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_key: str
    summary: str


class IssueLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_issue_id: UUID
    target_issue_id: UUID
    link_type: IssueLinkType
    source_issue: IssueBriefRef | None = None
    target_issue: IssueBriefRef | None = None
    created_at: datetime


class IssueCommentCreate(BaseModel):
    content: str


class IssueCommentUpdate(BaseModel):
    content: str


class IssueCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_id: UUID
    content: str
    author: UserBrief | None = None
    created_at: datetime
    updated_at: datetime


class IssueActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_id: UUID
    action: str
    field_name: str | None
    old_value: str | None
    new_value: str | None
    user_id: UUID
    created_at: datetime
