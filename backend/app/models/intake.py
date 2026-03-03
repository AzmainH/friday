from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class IntakeForm(BaseModel, AuditMixin):
    __tablename__ = "intake_forms"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    fields_schema: Mapped[dict] = mapped_column(
        pg.JSONB, nullable=False, default=list
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    public_slug: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True
    )

    project = relationship("Project")
    submissions = relationship(
        "IntakeSubmission",
        back_populates="form",
        cascade="all, delete-orphan",
    )


class IntakeSubmission(BaseModel, TimestampMixin):
    __tablename__ = "intake_submissions"

    form_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("intake_forms.id"),
        nullable=False,
        index=True,
    )
    submitted_by_email: Mapped[str | None] = mapped_column(
        String(254), nullable=True
    )
    submitted_by_name: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    data_json: Mapped[dict] = mapped_column(
        pg.JSONB, nullable=False, default=dict
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )
    created_issue_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=True,
    )
    reviewed_by: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    form = relationship("IntakeForm", back_populates="submissions")
    created_issue = relationship("Issue")
    reviewer = relationship("User")
