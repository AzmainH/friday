from uuid import UUID

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import AuditMixin, BaseModel


class ProjectTemplate(BaseModel, AuditMixin):
    __tablename__ = "project_templates"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    is_system: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    template_data: Mapped[dict] = mapped_column(
        pg.JSONB, nullable=False, default=dict
    )
