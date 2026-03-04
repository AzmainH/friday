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

# Phase 3-10 – PM, Roadmap, Wiki, Dashboard, Automation models
from app.models.approval import ApprovalStep, IssueApproval
from app.models.automation import AutomationExecutionLog, AutomationRule
from app.models.baseline import Baseline, BaselineSnapshot
from app.models.budget import CostEntry, ProjectBudget
from app.models.dashboard import CustomDashboard, SavedReport
from app.models.decision import Decision, DecisionIssueLink
from app.models.intake import IntakeForm, IntakeSubmission
from app.models.milestone import GateApproval, Milestone
from app.models.portfolio import CrossProjectDependency, Release, ReleaseProject
from app.models.raci import RACIAssignment
from app.models.recurring import RecurringRule
from app.models.risk import Risk, RiskResponse
from app.models.roadmap import (
    RoadmapPlan,
    RoadmapPlanProject,
    RoadmapScenario,
    RoadmapScenarioOverride,
)
from app.models.schedule import ScheduleRun
from app.models.sprint import Sprint, SprintStatus
from app.models.sla import IssueSLAStatus, SLAPolicy
from app.models.stakeholder import Stakeholder
from app.models.template import ProjectTemplate
from app.models.integration import Integration, IntegrationType, WebhookLog
from app.models.wiki import WikiPage, WikiPageComment, WikiPageVersion, WikiSpace

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
    # Phase 3-10
    "Milestone",
    "GateApproval",
    "Baseline",
    "BaselineSnapshot",
    "RACIAssignment",
    "ProjectBudget",
    "CostEntry",
    "Decision",
    "DecisionIssueLink",
    "Stakeholder",
    "RoadmapPlan",
    "RoadmapPlanProject",
    "RoadmapScenario",
    "RoadmapScenarioOverride",
    "ScheduleRun",
    "Release",
    "ReleaseProject",
    "CrossProjectDependency",
    "RecurringRule",
    "SLAPolicy",
    "IssueSLAStatus",
    "IntakeForm",
    "IntakeSubmission",
    "ApprovalStep",
    "IssueApproval",
    "WikiSpace",
    "WikiPage",
    "WikiPageVersion",
    "WikiPageComment",
    "CustomDashboard",
    "SavedReport",
    "AutomationRule",
    "AutomationExecutionLog",
    "ProjectTemplate",
    "Sprint",
    "SprintStatus",
    "Risk",
    "RiskResponse",
    # Integrations
    "Integration",
    "IntegrationType",
    "WebhookLog",
]
