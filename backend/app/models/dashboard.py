from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel


class DashboardScope(StrEnum):
    PERSONAL = "personal"
    PROJECT = "project"
    TEAM = "team"
    PORTFOLIO = "portfolio"
    CUSTOM = "custom"


class CustomDashboard(BaseModel, AuditMixin):
    __tablename__ = "custom_dashboards"

    owner_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    scope: Mapped[str] = mapped_column(
        String(20),
        default=DashboardScope.PERSONAL,
        nullable=False,
    )
    scope_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True), nullable=True
    )
    layout_json: Mapped[dict] = mapped_column(
        pg.JSONB, default=dict, server_default="{}", nullable=False
    )
    widgets_json: Mapped[list] = mapped_column(
        pg.JSONB, default=list, server_default="[]", nullable=False
    )
    is_shared: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    owner = relationship("User")


class SavedReport(BaseModel, AuditMixin):
    __tablename__ = "saved_reports"

    owner_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    config_json: Mapped[dict] = mapped_column(
        pg.JSONB, default=dict, server_default="{}", nullable=False
    )
    project_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=True,
        index=True,
    )

    owner = relationship("User")
    project = relationship("Project")
