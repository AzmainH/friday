from datetime import date
from uuid import UUID

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class RoadmapPlan(BaseModel, AuditMixin):
    __tablename__ = "roadmap_plans"

    workspace_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("workspaces.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    workspace = relationship("Workspace")
    plan_projects = relationship(
        "RoadmapPlanProject", back_populates="plan", cascade="all, delete-orphan"
    )
    scenarios = relationship(
        "RoadmapScenario", back_populates="plan", cascade="all, delete-orphan"
    )


class RoadmapPlanProject(BaseModel, TimestampMixin):
    __tablename__ = "roadmap_plan_projects"
    __table_args__ = (
        UniqueConstraint("plan_id", "project_id", name="uq_roadmap_plan_project"),
    )

    plan_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("roadmap_plans.id"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    color: Mapped[str] = mapped_column(String(7), default="#1976d2", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    plan = relationship("RoadmapPlan", back_populates="plan_projects")
    project = relationship("Project")


class RoadmapScenario(BaseModel, AuditMixin):
    __tablename__ = "roadmap_scenarios"

    plan_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("roadmap_plans.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_baseline: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    plan = relationship("RoadmapPlan", back_populates="scenarios")
    overrides = relationship(
        "RoadmapScenarioOverride",
        back_populates="scenario",
        cascade="all, delete-orphan",
    )


class RoadmapScenarioOverride(BaseModel, TimestampMixin):
    __tablename__ = "roadmap_scenario_overrides"
    __table_args__ = (
        UniqueConstraint(
            "scenario_id", "issue_id", name="uq_roadmap_scenario_override"
        ),
    )

    scenario_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("roadmap_scenarios.id"),
        nullable=False,
        index=True,
    )
    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
    )
    override_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    override_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    override_assignee_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    scenario = relationship("RoadmapScenario", back_populates="overrides")
