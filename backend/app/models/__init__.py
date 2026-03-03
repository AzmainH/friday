from app.core.database import Base
from app.models.base import AuditMixin, BaseModel, SoftDeleteMixin, TimestampMixin

# Phase 1 – Core models
from app.models.members import OrgMember, ProjectMember, WorkspaceMember
from app.models.organization import Organization
from app.models.project import Project, ProjectStatus, RAGStatus
from app.models.role import Role, RolePermission
from app.models.team import Team, TeamMember
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.models.workspace import Workspace

# Phase 2 – Issue Engine models
from app.models.custom_field import (
    CustomFieldDefinition,
    CustomFieldType,
    CustomFieldValue,
)
from app.models.issue import Issue
from app.models.issue_extras import (
    Component,
    Label,
    ProjectIssueCounter,
    TimeEntry,
    Version,
    issue_labels,
    issue_watchers,
)
from app.models.issue_relation import (
    IssueActivityLog,
    IssueComment,
    IssueLink,
    IssueLinkType,
)
from app.models.issue_type import IssueType
from app.models.notification import (
    AuditLog,
    Favorite,
    Notification,
    RecentItem,
    SavedView,
    TaskStatus,
    Upload,
)
from app.models.workflow import (
    StatusCategory,
    Workflow,
    WorkflowStatus,
    WorkflowTransition,
)

__all__ = [
    # Base
    "Base",
    "BaseModel",
    "TimestampMixin",
    "AuditMixin",
    "SoftDeleteMixin",
    # Phase 1
    "User",
    "UserPreferences",
    "Organization",
    "Workspace",
    "Team",
    "TeamMember",
    "Project",
    "ProjectStatus",
    "RAGStatus",
    "Role",
    "RolePermission",
    "OrgMember",
    "WorkspaceMember",
    "ProjectMember",
    # Phase 2 – Issue Engine
    "IssueType",
    "Workflow",
    "StatusCategory",
    "WorkflowStatus",
    "WorkflowTransition",
    "Issue",
    "CustomFieldType",
    "CustomFieldDefinition",
    "CustomFieldValue",
    "IssueLinkType",
    "IssueLink",
    "IssueComment",
    "IssueActivityLog",
    "issue_labels",
    "issue_watchers",
    "Label",
    "Component",
    "Version",
    "TimeEntry",
    "ProjectIssueCounter",
    "AuditLog",
    "Notification",
    "SavedView",
    "Favorite",
    "RecentItem",
    "TaskStatus",
    "Upload",
]
