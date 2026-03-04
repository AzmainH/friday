import enum
from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin


class SprintStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Sprint(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "sprints"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[SprintStatus] = mapped_column(
        Enum(SprintStatus, name="sprint_status", native_enum=False),
        default=SprintStatus.PLANNING,
        nullable=False,
    )
    velocity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    project = relationship("Project")
    issues = relationship("Issue", back_populates="sprint")
