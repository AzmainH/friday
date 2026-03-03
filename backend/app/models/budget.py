from datetime import date
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Date, Enum, Float, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel


class CostCategory(StrEnum):
    labor = "labor"
    software = "software"
    hardware = "hardware"
    travel = "travel"
    consulting = "consulting"
    other = "other"


class ProjectBudget(BaseModel, AuditMixin):
    __tablename__ = "project_budgets"
    __table_args__ = (
        UniqueConstraint("project_id", name="uq_project_budgets_project"),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    total_budget: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    project = relationship("Project")
    cost_entries = relationship("CostEntry", back_populates="project_budget", lazy="selectin")


class CostEntry(BaseModel, AuditMixin):
    __tablename__ = "cost_entries"
    __table_args__ = (
        Index("ix_cost_entries_project_date", "project_id", "entry_date"),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    issue_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=True,
        index=True,
    )
    category: Mapped[CostCategory] = mapped_column(
        Enum(CostCategory, name="cost_category", native_enum=False),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)

    project = relationship("Project")
    project_budget = relationship(
        "ProjectBudget",
        primaryjoin="CostEntry.project_id == ProjectBudget.project_id",
        foreign_keys=[project_id],
        viewonly=True,
    )
