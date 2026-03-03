import enum
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class Workflow(BaseModel, AuditMixin):
    __tablename__ = "workflows"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(default=False, nullable=False)

    statuses = relationship("WorkflowStatus", back_populates="workflow")
    transitions = relationship("WorkflowTransition", back_populates="workflow")


class StatusCategory(str, enum.Enum):
    TO_DO = "to_do"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    BLOCKED = "blocked"


class WorkflowStatus(BaseModel, TimestampMixin):
    __tablename__ = "workflow_statuses"
    __table_args__ = (
        UniqueConstraint(
            "workflow_id", "name", name="uq_workflow_statuses_workflow_name"
        ),
    )

    workflow_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workflows.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[StatusCategory] = mapped_column(
        Enum(StatusCategory, name="status_category", native_enum=False),
        nullable=False,
    )
    color: Mapped[str] = mapped_column(String(7), default="#9e9e9e", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    workflow = relationship("Workflow", back_populates="statuses")


class WorkflowTransition(BaseModel):
    __tablename__ = "workflow_transitions"

    workflow_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workflows.id"),
        nullable=False,
        index=True,
    )
    from_status_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workflow_statuses.id"),
        nullable=False,
    )
    to_status_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workflow_statuses.id"),
        nullable=False,
    )
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    workflow = relationship("Workflow", back_populates="transitions")
    from_status = relationship(
        "WorkflowStatus", foreign_keys=[from_status_id]
    )
    to_status = relationship(
        "WorkflowStatus", foreign_keys=[to_status_id]
    )
