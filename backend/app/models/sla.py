from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class SLAPolicy(BaseModel, AuditMixin):
    __tablename__ = "sla_policies"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    priority_filter: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="Which priority this policy applies to"
    )
    response_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    resolution_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    project = relationship("Project")


class IssueSLAStatus(BaseModel, TimestampMixin):
    __tablename__ = "issue_sla_statuses"

    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        unique=True,
        nullable=False,
        index=True,
    )
    policy_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("sla_policies.id"),
        nullable=False,
    )
    response_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolution_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    first_responded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    response_breached: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    resolution_breached: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    issue = relationship("Issue")
    policy = relationship("SLAPolicy")
