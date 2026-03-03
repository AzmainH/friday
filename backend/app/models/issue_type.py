from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel


class IssueType(BaseModel, AuditMixin):
    __tablename__ = "issue_types"
    __table_args__ = (
        UniqueConstraint("project_id", "name", name="uq_issue_types_project_name"),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(50), default="task", nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#1976d2", nullable=False)
    hierarchy_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_subtask: Mapped[bool] = mapped_column(default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project = relationship("Project")
