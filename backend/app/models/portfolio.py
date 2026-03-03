from datetime import date, datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class ReleaseStatus(StrEnum):
    planning = "planning"
    in_progress = "in_progress"
    released = "released"
    archived = "archived"


class Release(BaseModel, AuditMixin):
    __tablename__ = "releases"

    workspace_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workspaces.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ReleaseStatus] = mapped_column(
        Enum(ReleaseStatus, name="release_status", native_enum=False),
        default=ReleaseStatus.planning,
        nullable=False,
    )
    release_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    released_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    workspace = relationship("Workspace")
    release_projects = relationship(
        "ReleaseProject", back_populates="release", cascade="all, delete-orphan"
    )


class ReleaseProject(BaseModel, TimestampMixin):
    __tablename__ = "release_projects"
    __table_args__ = (
        UniqueConstraint("release_id", "project_id", name="uq_release_projects"),
    )

    release_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("releases.id"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )

    release = relationship("Release", back_populates="release_projects")
    project = relationship("Project")


class CrossProjectDependency(BaseModel, AuditMixin):
    __tablename__ = "cross_project_dependencies"

    source_project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    target_project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    source_issue_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=True,
    )
    target_issue_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=True,
    )
    dependency_type: Mapped[str] = mapped_column(
        String(50), default="blocks", nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    source_project = relationship("Project", foreign_keys=[source_project_id])
    target_project = relationship("Project", foreign_keys=[target_project_id])
    source_issue = relationship("Issue", foreign_keys=[source_issue_id])
    target_issue = relationship("Issue", foreign_keys=[target_issue_id])
