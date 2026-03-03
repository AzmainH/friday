import enum
from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin, TimestampMixin


class MilestoneStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class MilestoneType(str, enum.Enum):
    PHASE_GATE = "phase_gate"
    DELIVERABLE = "deliverable"
    PAYMENT = "payment"
    REVIEW = "review"
    CUSTOM = "custom"


class GateApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Milestone(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "milestones"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    milestone_type: Mapped[MilestoneType] = mapped_column(
        Enum(MilestoneType, name="milestone_type", native_enum=False),
        nullable=False,
    )
    status: Mapped[MilestoneStatus] = mapped_column(
        Enum(MilestoneStatus, name="milestone_status", native_enum=False),
        default=MilestoneStatus.NOT_STARTED,
        nullable=False,
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project = relationship("Project")
    gate_approvals = relationship(
        "GateApproval", back_populates="milestone", cascade="all, delete-orphan"
    )


class GateApproval(BaseModel, TimestampMixin):
    __tablename__ = "gate_approvals"

    milestone_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("milestones.id"),
        nullable=False,
        index=True,
    )
    approver_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    status: Mapped[GateApprovalStatus] = mapped_column(
        Enum(GateApprovalStatus, name="gate_approval_status", native_enum=False),
        default=GateApprovalStatus.PENDING,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    milestone = relationship("Milestone", back_populates="gate_approvals")
    approver = relationship("User")
