import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalStep(BaseModel, AuditMixin):
    __tablename__ = "approval_steps"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    approver_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    project = relationship("Project")
    approver = relationship("User")


class IssueApproval(BaseModel, TimestampMixin):
    __tablename__ = "issue_approvals"
    __table_args__ = (
        UniqueConstraint(
            "issue_id", "step_id", name="uq_issue_approval_step"
        ),
    )

    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
        index=True,
    )
    step_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("approval_steps.id"),
        nullable=False,
    )
    approver_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    status: Mapped[ApprovalStatus] = mapped_column(
        Enum(ApprovalStatus, name="approval_status", native_enum=False),
        default=ApprovalStatus.PENDING,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    issue = relationship("Issue")
    step = relationship("ApprovalStep")
    approver = relationship("User")
