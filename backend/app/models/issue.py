from datetime import date, datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin


class Issue(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "issues"
    __table_args__ = (
        CheckConstraint(
            "percent_complete >= 0 AND percent_complete <= 100",
            name="ck_issues_percent_complete_range",
        ),
        Index("ix_issues_project_deleted", "project_id", "is_deleted"),
        Index("ix_issues_assignee", "assignee_id"),
        Index("ix_issues_status", "status_id"),
        Index("ix_issues_milestone", "milestone_id"),
        Index("ix_issues_parent", "parent_issue_id"),
        Index(
            "ix_issues_search",
            "search_vector",
            postgresql_using="gin",
        ),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
    )
    issue_type_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issue_types.id"),
        nullable=False,
        index=True,
    )
    status_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workflow_statuses.id"),
        nullable=False,
    )
    issue_key: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(
        String(20), default="medium", nullable=False
    )
    assignee_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    reporter_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    parent_issue_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=True,
    )
    milestone_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        nullable=True,
    )
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    story_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    percent_complete: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rag_status: Mapped[str] = mapped_column(
        String(10), default="none", nullable=False
    )
    planned_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    planned_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    sort_order: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    search_vector = Column(TSVECTOR)

    project = relationship("Project")
    issue_type = relationship("IssueType")
    status = relationship("WorkflowStatus")
    assignee = relationship("User", foreign_keys=[assignee_id])
    reporter = relationship("User", foreign_keys=[reporter_id])
    parent = relationship(
        "Issue", remote_side="Issue.id", foreign_keys=[parent_issue_id]
    )
    children = relationship("Issue", foreign_keys=[parent_issue_id])
    comments = relationship("IssueComment", back_populates="issue")
    labels = relationship("Label", secondary="issue_labels")
    watchers = relationship("User", secondary="issue_watchers")
