import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, BaseModel, TimestampMixin


class TriggerType(str, enum.Enum):
    ISSUE_CREATED = "issue_created"
    ISSUE_UPDATED = "issue_updated"
    STATUS_CHANGED = "status_changed"
    ASSIGNEE_CHANGED = "assignee_changed"
    PRIORITY_CHANGED = "priority_changed"
    COMMENT_ADDED = "comment_added"
    DUE_DATE_APPROACHING = "due_date_approaching"
    SCHEDULED = "scheduled"


class ActionType(str, enum.Enum):
    CHANGE_STATUS = "change_status"
    CHANGE_ASSIGNEE = "change_assignee"
    CHANGE_PRIORITY = "change_priority"
    ADD_LABEL = "add_label"
    REMOVE_LABEL = "remove_label"
    ADD_COMMENT = "add_comment"
    SEND_NOTIFICATION = "send_notification"
    MOVE_TO_PROJECT = "move_to_project"


class AutomationRule(BaseModel, AuditMixin):
    __tablename__ = "automation_rules"

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    trigger_type: Mapped[TriggerType] = mapped_column(
        Enum(TriggerType, name="trigger_type", native_enum=False),
        nullable=False,
    )
    trigger_config: Mapped[dict] = mapped_column(
        pg.JSONB, default=dict, server_default="{}", nullable=False
    )
    condition_config: Mapped[dict | None] = mapped_column(
        pg.JSONB, nullable=True
    )
    action_type: Mapped[ActionType] = mapped_column(
        Enum(ActionType, name="action_type", native_enum=False),
        nullable=False,
    )
    action_config: Mapped[dict] = mapped_column(
        pg.JSONB, default=dict, server_default="{}", nullable=False
    )
    execution_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    last_executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    project = relationship("Project")
    execution_logs = relationship(
        "AutomationExecutionLog",
        back_populates="rule",
        cascade="all, delete-orphan",
    )


class AutomationExecutionLog(BaseModel, TimestampMixin):
    __tablename__ = "automation_execution_logs"
    __table_args__ = (
        Index(
            "ix_automation_exec_logs_rule_executed",
            "rule_id",
            "executed_at",
        ),
    )

    rule_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("automation_rules.id"),
        nullable=False,
        index=True,
    )
    issue_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("issues.id"),
        nullable=True,
        index=True,
    )
    trigger_data: Mapped[dict | None] = mapped_column(
        pg.JSONB, nullable=True
    )
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    rule = relationship("AutomationRule", back_populates="execution_logs")
    issue = relationship("Issue")
