import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin, TimestampMixin


class IssueLinkType(str, enum.Enum):
    BLOCKS = "blocks"
    IS_BLOCKED_BY = "is_blocked_by"
    RELATES_TO = "relates_to"
    DUPLICATES = "duplicates"
    IS_DUPLICATED_BY = "is_duplicated_by"
    DEPENDS_ON = "depends_on"
    IS_DEPENDENCY_OF = "is_dependency_of"


class IssueLink(BaseModel, TimestampMixin):
    __tablename__ = "issue_links"
    __table_args__ = (
        Index("ix_issue_links_source", "source_issue_id"),
        Index("ix_issue_links_target", "target_issue_id"),
    )

    source_issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
    )
    target_issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
    )
    link_type: Mapped[IssueLinkType] = mapped_column(
        Enum(IssueLinkType, name="issue_link_type", native_enum=False),
        nullable=False,
    )
    created_by: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    source_issue = relationship("Issue", foreign_keys=[source_issue_id])
    target_issue = relationship("Issue", foreign_keys=[target_issue_id])


class IssueComment(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "issue_comments"
    __table_args__ = (
        Index("ix_issue_comments_issue_created", "issue_id", "created_at"),
    )

    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    issue = relationship("Issue", back_populates="comments")
    author = relationship("User")


class IssueActivityLog(BaseModel):
    __tablename__ = "issue_activity_log"
    __table_args__ = (
        Index("ix_issue_activity_issue_created", "issue_id", "created_at"),
    )

    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    field_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
