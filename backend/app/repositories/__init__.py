from app.repositories.base import BaseRepository
from app.repositories.member import (
    OrgMemberRepository,
    ProjectMemberRepository,
    WorkspaceMemberRepository,
)
from app.repositories.organization import OrganizationRepository
from app.repositories.project import ProjectRepository
from app.repositories.role import RoleRepository
from app.repositories.team import TeamMemberRepository, TeamRepository
from app.repositories.user import UserRepository
from app.repositories.workspace import WorkspaceRepository
from app.repositories.issue_type import IssueTypeRepository
from app.repositories.workflow import (
    WorkflowRepository,
    WorkflowStatusRepository,
    WorkflowTransitionRepository,
)
from app.repositories.issue import IssueRepository
from app.repositories.issue_relation import (
    IssueActivityRepository,
    IssueCommentRepository,
    IssueLinkRepository,
)
from app.repositories.issue_extras import (
    ComponentRepository,
    FavoriteRepository,
    LabelRepository,
    NotificationRepository,
    RecentItemRepository,
    SavedViewRepository,
    TaskStatusRepository,
    TimeEntryRepository,
    UploadRepository,
    VersionRepository,
)
# Phase 3-10 repositories
from app.repositories.milestone import GateApprovalRepository, MilestoneRepository
from app.repositories.baseline import BaselineRepository, BaselineSnapshotRepository
from app.repositories.raci import RACIRepository
from app.repositories.budget import CostEntryRepository, ProjectBudgetRepository
from app.repositories.decision import DecisionIssueLinkRepository, DecisionRepository
from app.repositories.stakeholder import StakeholderRepository
from app.repositories.roadmap import (
    RoadmapPlanProjectRepository,
    RoadmapPlanRepository,
    RoadmapScenarioOverrideRepository,
    RoadmapScenarioRepository,
)
from app.repositories.portfolio import (
    CrossProjectDependencyRepository,
    ReleaseProjectRepository,
    ReleaseRepository,
)
from app.repositories.recurring import RecurringRuleRepository
from app.repositories.dashboard import CustomDashboardRepository, SavedReportRepository
from app.repositories.automation import (
    AutomationExecutionLogRepository,
    AutomationRuleRepository,
)
from app.repositories.template import ProjectTemplateRepository
from app.repositories.wiki import (
    WikiPageCommentRepository,
    WikiPageRepository,
    WikiPageVersionRepository,
    WikiSpaceRepository,
)

__all__ = [
    "BaseRepository",
    "OrgMemberRepository",
    "OrganizationRepository",
    "ProjectMemberRepository",
    "ProjectRepository",
    "RoleRepository",
    "TeamMemberRepository",
    "TeamRepository",
    "UserRepository",
    "WorkspaceMemberRepository",
    "WorkspaceRepository",
    # issue engine
    "IssueTypeRepository",
    "WorkflowRepository",
    "WorkflowStatusRepository",
    "WorkflowTransitionRepository",
    "IssueRepository",
    "IssueActivityRepository",
    "IssueCommentRepository",
    "IssueLinkRepository",
    "ComponentRepository",
    "FavoriteRepository",
    "LabelRepository",
    "NotificationRepository",
    "RecentItemRepository",
    "SavedViewRepository",
    "TaskStatusRepository",
    "TimeEntryRepository",
    "UploadRepository",
    "VersionRepository",
    # Phase 3-10
    "MilestoneRepository",
    "GateApprovalRepository",
    "BaselineRepository",
    "BaselineSnapshotRepository",
    "RACIRepository",
    "ProjectBudgetRepository",
    "CostEntryRepository",
    "DecisionRepository",
    "DecisionIssueLinkRepository",
    "StakeholderRepository",
    "RoadmapPlanRepository",
    "RoadmapPlanProjectRepository",
    "RoadmapScenarioRepository",
    "RoadmapScenarioOverrideRepository",
    "ReleaseRepository",
    "ReleaseProjectRepository",
    "CrossProjectDependencyRepository",
    "RecurringRuleRepository",
    "CustomDashboardRepository",
    "SavedReportRepository",
    "AutomationRuleRepository",
    "AutomationExecutionLogRepository",
    "ProjectTemplateRepository",
    "WikiSpaceRepository",
    "WikiPageRepository",
    "WikiPageVersionRepository",
    "WikiPageCommentRepository",
]
