from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin


class Stakeholder(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "stakeholders"
    __table_args__ = (
        CheckConstraint(
            "interest_level >= 1 AND interest_level <= 5",
            name="ck_stakeholders_interest_level_range",
        ),
        CheckConstraint(
            "influence_level >= 1 AND influence_level <= 5",
            name="ck_stakeholders_influence_level_range",
        ),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    organization_name: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    interest_level: Mapped[int] = mapped_column(Integer, nullable=False)
    influence_level: Mapped[int] = mapped_column(Integer, nullable=False)
    engagement_strategy: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    project = relationship("Project")
