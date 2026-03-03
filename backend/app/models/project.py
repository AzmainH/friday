import enum
from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin


class ProjectStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RAGStatus(str, enum.Enum):
    GREEN = "green"
    AMBER = "amber"
    RED = "red"
    NONE = "none"


class Project(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "projects"

    workspace_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workspaces.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_prefix: Mapped[str] = mapped_column(
        String(10), unique=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status", native_enum=False),
        default=ProjectStatus.PLANNING,
        nullable=False,
    )
    lead_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    target_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    rag_status: Mapped[RAGStatus] = mapped_column(
        Enum(RAGStatus, name="rag_status", native_enum=False),
        default=RAGStatus.NONE,
        nullable=False,
    )
    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    archived_by: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True), nullable=True
    )

    workspace = relationship("Workspace", back_populates="projects")
    lead = relationship("User", foreign_keys=[lead_id])
    members = relationship("ProjectMember", back_populates="project")
