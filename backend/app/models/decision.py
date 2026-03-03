import enum
from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin, TimestampMixin


class DecisionStatus(str, enum.Enum):
    PROPOSED = "proposed"
    UNDER_REVIEW = "under_review"
    DECIDED = "decided"
    DEFERRED = "deferred"
    SUPERSEDED = "superseded"


class Decision(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "decisions"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[DecisionStatus] = mapped_column(
        Enum(DecisionStatus, name="decision_status", native_enum=False),
        default=DecisionStatus.PROPOSED,
        nullable=False,
    )
    decided_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)

    project = relationship("Project")
    issue_links = relationship(
        "DecisionIssueLink",
        back_populates="decision",
        cascade="all, delete-orphan",
    )


class DecisionIssueLink(BaseModel, TimestampMixin):
    __tablename__ = "decision_issue_links"
    __table_args__ = (
        UniqueConstraint(
            "decision_id", "issue_id", name="uq_decision_issue_link"
        ),
    )

    decision_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("decisions.id"),
        nullable=False,
        index=True,
    )
    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
        index=True,
    )

    decision = relationship("Decision", back_populates="issue_links")
    issue = relationship("Issue")
