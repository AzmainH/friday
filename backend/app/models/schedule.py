from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin


class ScheduleRunStatus(StrEnum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class ScheduleRun(BaseModel, TimestampMixin):
    __tablename__ = "schedule_runs"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    triggered_by: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    status: Mapped[ScheduleRunStatus] = mapped_column(
        Enum(ScheduleRunStatus, name="schedule_run_status", native_enum=False),
        default=ScheduleRunStatus.pending,
        nullable=False,
    )
    result_json: Mapped[dict | None] = mapped_column(pg.JSONB, nullable=True)
    critical_path_json: Mapped[list | None] = mapped_column(pg.JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    project = relationship("Project")
    triggered_by_user = relationship("User", foreign_keys=[triggered_by])
