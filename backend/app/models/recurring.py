import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel


class RecurrenceFrequency(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class RecurringRule(BaseModel, AuditMixin):
    __tablename__ = "recurring_rules"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    frequency: Mapped[RecurrenceFrequency] = mapped_column(
        Enum(RecurrenceFrequency, name="recurrence_frequency", native_enum=False),
        nullable=False,
    )
    day_of_week: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="0=Mon, 6=Sun"
    )
    day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    template_summary: Mapped[str] = mapped_column(String(500), nullable=False)
    template_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_issue_type_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issue_types.id"),
        nullable=True,
    )
    template_assignee_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    template_priority: Mapped[str] = mapped_column(
        String(20), default="medium", nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    project = relationship("Project")
    template_issue_type = relationship("IssueType")
    template_assignee = relationship("User")
