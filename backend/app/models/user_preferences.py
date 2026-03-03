from uuid import UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin


class UserPreferences(BaseModel, TimestampMixin):
    __tablename__ = "user_preferences"

    user_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True,
    )
    default_view: Mapped[str] = mapped_column(String(50), default="board")
    sidebar_state: Mapped[dict | None] = mapped_column(pg.JSONB, nullable=True)
    column_layouts: Mapped[dict | None] = mapped_column(pg.JSONB, nullable=True)
    notification_settings: Mapped[dict | None] = mapped_column(
        pg.JSONB, nullable=True
    )
    date_format: Mapped[str] = mapped_column(
        String(50), default="MMM d, yyyy"
    )
    timezone: Mapped[str] = mapped_column(String(100), default="UTC")

    user = relationship("User", back_populates="preferences")
