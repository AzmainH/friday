from datetime import date, datetime
from uuid import UUID

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class Baseline(BaseModel, AuditMixin):
    __tablename__ = "baselines"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    snapshot_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    project = relationship("Project")
    snapshots = relationship(
        "BaselineSnapshot", back_populates="baseline", cascade="all, delete-orphan"
    )


class BaselineSnapshot(BaseModel, TimestampMixin):
    __tablename__ = "baseline_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "baseline_id", "issue_id", name="uq_baseline_snapshots_baseline_issue"
        ),
    )

    baseline_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("baselines.id"),
        nullable=False,
        index=True,
    )
    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
        index=True,
    )
    planned_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    planned_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    story_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True), nullable=True
    )

    baseline = relationship("Baseline", back_populates="snapshots")
