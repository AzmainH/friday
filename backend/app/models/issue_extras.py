from datetime import date
from uuid import UUID

from sqlalchemy import (
    Column,
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AuditMixin, BaseModel, TimestampMixin


issue_labels = Table(
    "issue_labels",
    Base.metadata,
    Column(
        "issue_id",
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        primary_key=True,
    ),
    Column(
        "label_id",
        pg.UUID(as_uuid=True),
        ForeignKey("labels.id"),
        primary_key=True,
    ),
)

issue_watchers = Table(
    "issue_watchers",
    Base.metadata,
    Column(
        "issue_id",
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        primary_key=True,
    ),
    Column(
        "user_id",
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        primary_key=True,
    ),
)


class Label(BaseModel, TimestampMixin):
    __tablename__ = "labels"
    __table_args__ = (
        UniqueConstraint("project_id", "name", name="uq_labels_project_name"),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#1976d2", nullable=False)

    project = relationship("Project")


class Component(BaseModel, AuditMixin):
    __tablename__ = "components"
    __table_args__ = (
        UniqueConstraint(
            "project_id", "name", name="uq_components_project_name"
        ),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    lead_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    project = relationship("Project")
    lead = relationship("User")


class Version(BaseModel, AuditMixin):
    __tablename__ = "versions"
    __table_args__ = (
        UniqueConstraint(
            "project_id", "name", name="uq_versions_project_name"
        ),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    release_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="unreleased", nullable=False
    )

    project = relationship("Project")


class TimeEntry(BaseModel, TimestampMixin):
    __tablename__ = "time_entries"
    __table_args__ = (
        Index("ix_time_entries_issue", "issue_id"),
        Index("ix_time_entries_user_date", "user_id", "date"),
    )

    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    hours: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    issue = relationship("Issue")
    user = relationship("User")


class ProjectIssueCounter(Base):
    __tablename__ = "project_issue_counters"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        primary_key=True,
    )
    prefix: Mapped[str] = mapped_column(String(10), nullable=False)
    next_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
