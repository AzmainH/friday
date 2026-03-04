import enum
from datetime import date, datetime
from uuid import UUID

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin, TimestampMixin


class RiskCategory(str, enum.Enum):
    TECHNICAL = "technical"
    SCHEDULE = "schedule"
    RESOURCE = "resource"
    BUDGET = "budget"
    SCOPE = "scope"
    EXTERNAL = "external"
    QUALITY = "quality"


class RiskProbability(str, enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class RiskImpact(str, enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class RiskStatus(str, enum.Enum):
    IDENTIFIED = "identified"
    ANALYZING = "analyzing"
    MITIGATING = "mitigating"
    RESOLVED = "resolved"
    ACCEPTED = "accepted"
    CLOSED = "closed"


class RiskResponseType(str, enum.Enum):
    AVOID = "avoid"
    MITIGATE = "mitigate"
    TRANSFER = "transfer"
    ACCEPT = "accept"


class RiskResponseStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# Map enum values to numeric scores for risk_score computation
_PROBABILITY_SCORES: dict[RiskProbability, int] = {
    RiskProbability.VERY_LOW: 1,
    RiskProbability.LOW: 2,
    RiskProbability.MEDIUM: 3,
    RiskProbability.HIGH: 4,
    RiskProbability.VERY_HIGH: 5,
}

_IMPACT_SCORES: dict[RiskImpact, int] = {
    RiskImpact.VERY_LOW: 1,
    RiskImpact.LOW: 2,
    RiskImpact.MEDIUM: 3,
    RiskImpact.HIGH: 4,
    RiskImpact.VERY_HIGH: 5,
}


def compute_risk_score(probability: RiskProbability, impact: RiskImpact) -> int:
    return _PROBABILITY_SCORES[probability] * _IMPACT_SCORES[impact]


class Risk(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "risks"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[RiskCategory] = mapped_column(
        Enum(RiskCategory, name="risk_category", native_enum=False),
        default=RiskCategory.TECHNICAL,
        nullable=False,
    )
    probability: Mapped[RiskProbability] = mapped_column(
        Enum(RiskProbability, name="risk_probability", native_enum=False),
        default=RiskProbability.MEDIUM,
        nullable=False,
    )
    impact: Mapped[RiskImpact] = mapped_column(
        Enum(RiskImpact, name="risk_impact", native_enum=False),
        default=RiskImpact.MEDIUM,
        nullable=False,
    )
    risk_score: Mapped[int] = mapped_column(Integer, default=9, nullable=False)
    status: Mapped[RiskStatus] = mapped_column(
        Enum(RiskStatus, name="risk_status", native_enum=False),
        default=RiskStatus.IDENTIFIED,
        nullable=False,
    )
    owner_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    mitigation_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    contingency_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    trigger_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    project = relationship("Project")
    owner = relationship("User", foreign_keys=[owner_id])
    responses = relationship(
        "RiskResponse",
        back_populates="risk",
        cascade="all, delete-orphan",
    )


class RiskResponse(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "risk_responses"

    risk_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("risks.id"),
        nullable=False,
        index=True,
    )
    response_type: Mapped[RiskResponseType] = mapped_column(
        Enum(RiskResponseType, name="risk_response_type", native_enum=False),
        default=RiskResponseType.MITIGATE,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[RiskResponseStatus] = mapped_column(
        Enum(RiskResponseStatus, name="risk_response_status", native_enum=False),
        default=RiskResponseStatus.PLANNED,
        nullable=False,
    )
    assigned_to: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    risk = relationship("Risk", back_populates="responses")
    assignee = relationship("User", foreign_keys=[assigned_to])
