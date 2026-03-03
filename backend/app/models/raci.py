import enum
import uuid
from uuid import UUID

from sqlalchemy import Enum as SAEnum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin


class RACIRoleType(str, enum.Enum):
    RESPONSIBLE = "responsible"
    ACCOUNTABLE = "accountable"
    CONSULTED = "consulted"
    INFORMED = "informed"


class RACIAssignment(BaseModel, TimestampMixin):
    __tablename__ = "raci_assignments"
    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "issue_id",
            "user_id",
            "role_type",
            name="uq_raci_assignment",
        ),
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
    user_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    role_type: Mapped[str] = mapped_column(
        SAEnum(RACIRoleType, native_enum=False, length=20),
        nullable=False,
    )

    project = relationship("Project")
    user = relationship("User")
