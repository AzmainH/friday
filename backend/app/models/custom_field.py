import enum
from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class CustomFieldType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    DATETIME = "datetime"
    SINGLE_SELECT = "single_select"
    MULTI_SELECT = "multi_select"
    USER = "user"
    URL = "url"
    CHECKBOX = "checkbox"
    PARAGRAPH = "paragraph"
    CURRENCY = "currency"


class CustomFieldDefinition(BaseModel, AuditMixin):
    __tablename__ = "custom_field_definitions"
    __table_args__ = (
        UniqueConstraint(
            "project_id", "name", name="uq_custom_field_defs_project_name"
        ),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    field_type: Mapped[CustomFieldType] = mapped_column(
        Enum(CustomFieldType, name="custom_field_type", native_enum=False),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    options_json: Mapped[dict | None] = mapped_column(pg.JSONB, nullable=True)
    validation_json: Mapped[dict | None] = mapped_column(pg.JSONB, nullable=True)
    default_value: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_required: Mapped[bool] = mapped_column(default=False, nullable=False)

    project = relationship("Project")
    values = relationship("CustomFieldValue", back_populates="field_definition")


class CustomFieldValue(BaseModel, TimestampMixin):
    __tablename__ = "custom_field_values"
    __table_args__ = (
        UniqueConstraint(
            "issue_id",
            "field_definition_id",
            name="uq_custom_field_values_issue_field",
        ),
    )

    issue_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=False,
        index=True,
    )
    field_definition_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("custom_field_definitions.id"),
        nullable=False,
        index=True,
    )
    value_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_number: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    value_json: Mapped[dict | None] = mapped_column(pg.JSONB, nullable=True)

    field_definition = relationship(
        "CustomFieldDefinition", back_populates="values"
    )
