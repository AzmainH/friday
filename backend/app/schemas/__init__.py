from app.schemas.base import (
    CursorPage,
    DetailedHealthResponse,
    ErrorDetail,
    ErrorResponse,
    HealthResponse,
    MessageResponse,
    PaginationMeta,
)
from app.schemas.member import (
    OrgMemberCreate,
    OrgMemberResponse,
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectMemberUpdate,
    WorkspaceMemberCreate,
    WorkspaceMemberResponse,
)
from app.schemas.organization import (
    OrgBase,
    OrgCreate,
    OrgResponse,
    OrgUpdate,
)
from app.schemas.project import (
    ProjectBase,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.schemas.role import (
    RolePermissionResponse,
    RoleResponse,
)
from app.schemas.team import (
    TeamBase,
    TeamCreate,
    TeamMemberCreate,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
)
from app.schemas.user import (
    UserBase,
    UserBrief,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.schemas.user_preferences import (
    UserPreferencesResponse,
    UserPreferencesUpdate,
)
from app.schemas.workspace import (
    WorkspaceBase,
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from app.schemas.issue_type import (
    IssueTypeBase,
    IssueTypeCreate,
    IssueTypeResponse,
    IssueTypeUpdate,
)
from app.schemas.workflow import (
    StatusCategory,
    WorkflowBase,
    WorkflowCreate,
    WorkflowDetailResponse,
    WorkflowResponse,
    WorkflowStatusCreate,
    WorkflowStatusResponse,
    WorkflowTransitionCreate,
    WorkflowTransitionResponse,
    WorkflowUpdate,
)
from app.schemas.issue import (
    IssueBase,
    IssueBrief,
    IssueBulkResponse,
    IssueBulkUpdateRequest,
    IssueCreate,
    IssueResponse,
    IssueUpdate,
)
from app.schemas.custom_field import (
    CustomFieldDefinitionCreate,
    CustomFieldDefinitionResponse,
    CustomFieldDefinitionUpdate,
    CustomFieldValueCreate,
    CustomFieldValueResponse,
)
from app.schemas.issue_relation import (
    IssueActivityResponse,
    IssueBriefRef,
    IssueCommentCreate,
    IssueCommentResponse,
    IssueCommentUpdate,
    IssueLinkCreate,
    IssueLinkResponse,
    IssueLinkType,
)
from app.schemas.issue_extras import (
    ComponentCreate,
    ComponentResponse,
    ComponentUpdate,
    FavoriteCreate,
    FavoriteResponse,
    LabelCreate,
    LabelResponse,
    NotificationResponse,
    SavedViewCreate,
    SavedViewResponse,
    SavedViewUpdate,
    TaskStatusResponse,
    TimeEntryCreate,
    TimeEntryResponse,
    UploadResponse,
    VersionCreate,
    VersionResponse,
    VersionUpdate,
)
from app.schemas.search import (
    SearchRequest,
    SearchResponse,
    SearchResult,
)
# Phase 3-10 schemas
from app.schemas.milestone import (
    GateApprovalCreate,
    GateApprovalDecision,
    GateApprovalResponse,
    MilestoneCreate,
    MilestoneResponse,
    MilestoneUpdate,
)
from app.schemas.baseline import (
    BaselineCompareResponse,
    BaselineCreate,
    BaselineDetailResponse,
    BaselineResponse,
    BaselineSnapshotResponse,
    BaselineVarianceItem,
)
from app.schemas.raci import (
    RACIAssignmentCreate,
    RACIAssignmentResponse,
    RACIBulkUpdate,
    RACIMatrixResponse,
    RACIMatrixRow,
)
from app.schemas.budget import (
    BudgetSummaryResponse,
    CostEntryCreate,
    CostEntryResponse,
    MonthlyBurn,
    ProjectBudgetCreate,
    ProjectBudgetResponse,
    ProjectBudgetUpdate,
)
from app.schemas.decision import (
    DecisionCreate,
    DecisionIssueLinkCreate,
    DecisionIssueLinkResponse,
    DecisionResponse,
    DecisionUpdate,
)
from app.schemas.stakeholder import (
    StakeholderCreate,
    StakeholderMatrixEntry,
    StakeholderMatrixResponse,
    StakeholderResponse,
    StakeholderUpdate,
)
from app.schemas.roadmap import (
    RoadmapPlanCreate,
    RoadmapPlanProjectCreate,
    RoadmapPlanProjectResponse,
    RoadmapPlanResponse,
    RoadmapPlanUpdate,
    RoadmapScenarioCreate,
    RoadmapScenarioOverrideCreate,
    RoadmapScenarioOverrideResponse,
    RoadmapScenarioResponse,
    RoadmapTimelineIssue,
    RoadmapTimelineItem,
    RoadmapTimelineResponse,
)
from app.schemas.portfolio import (
    AffectedProjectDetail,
    CrossProjectDependencyCreate,
    CrossProjectDependencyResponse,
    ImpactAnalysisResponse,
    PortfolioOverviewResponse,
    PortfolioProjectResponse,
    ReleaseCreate,
    ReleaseProjectCreate,
    ReleaseProjectResponse,
    ReleaseResponse,
    ReleaseUpdate,
)
from app.schemas.recurring import (
    RecurringRuleCreate,
    RecurringRuleResponse,
    RecurringRuleUpdate,
)
from app.schemas.sla import (
    IssueSLAStatusResponse,
    SLAPolicyCreate,
    SLAPolicyResponse,
    SLAPolicyUpdate,
)
from app.schemas.intake import (
    IntakeFormCreate,
    IntakeFormResponse,
    IntakeFormUpdate,
    IntakeSubmissionCreate,
    IntakeSubmissionResponse,
    IntakeSubmissionReview,
)
from app.schemas.approval import (
    ApprovalStepCreate,
    ApprovalStepResponse,
    ApprovalStepUpdate,
    IssueApprovalDecision,
    IssueApprovalResponse,
)
from app.schemas.wiki import (
    WikiPageCommentCreate,
    WikiPageCommentResponse,
    WikiPageCreate,
    WikiPageResponse,
    WikiPageTreeNode,
    WikiPageUpdate,
    WikiPageVersionResponse,
    WikiSearchResult,
    WikiSpaceCreate,
    WikiSpaceResponse,
    WikiSpaceUpdate,
)
from app.schemas.dashboard import (
    CustomDashboardCreate,
    CustomDashboardResponse,
    CustomDashboardUpdate,
    PersonalDashboardResponse,
    PortfolioDashboardResponse,
    ProjectDashboardResponse,
    ReportDataResponse,
    RunReportRequest,
    SavedReportCreate,
    SavedReportResponse,
    SavedReportUpdate,
)
from app.schemas.automation import (
    AutomationExecutionLogResponse,
    AutomationRuleCreate,
    AutomationRuleResponse,
    AutomationRuleUpdate,
    AutomationTestRequest,
    AutomationTestResponse,
)
from app.schemas.template import (
    ProjectTemplateCreate,
    ProjectTemplateResponse,
    ProjectTemplateUpdate,
    ProjectWizardRequest,
    ProjectWizardResponse,
)
from app.schemas.ai import (
    AIRiskItem,
    AIRiskResponse,
    AISummaryResponse,
    AITaskRequest,
    AITaskResponse,
)
from app.schemas.import_export import (
    ExportRequest,
    ImportExportTaskResponse,
    ImportPreviewResponse,
    ImportRequest,
)
from app.schemas.search_global import (
    SearchParams,
    SearchResultItem,
)

__all__ = [
    # base
    "CursorPage",
    "DetailedHealthResponse",
    "ErrorDetail",
    "ErrorResponse",
    "HealthResponse",
    "MessageResponse",
    "PaginationMeta",
    # user
    "UserBase",
    "UserBrief",
    "UserCreate",
    "UserResponse",
    "UserUpdate",
    # organization
    "OrgBase",
    "OrgCreate",
    "OrgResponse",
    "OrgUpdate",
    # workspace
    "WorkspaceBase",
    "WorkspaceCreate",
    "WorkspaceResponse",
    "WorkspaceUpdate",
    # team
    "TeamBase",
    "TeamCreate",
    "TeamMemberCreate",
    "TeamMemberResponse",
    "TeamResponse",
    "TeamUpdate",
    # project
    "ProjectBase",
    "ProjectCreate",
    "ProjectResponse",
    "ProjectUpdate",
    # role
    "RolePermissionResponse",
    "RoleResponse",
    # members
    "OrgMemberCreate",
    "OrgMemberResponse",
    "ProjectMemberCreate",
    "ProjectMemberResponse",
    "ProjectMemberUpdate",
    "WorkspaceMemberCreate",
    "WorkspaceMemberResponse",
    # user preferences
    "UserPreferencesResponse",
    "UserPreferencesUpdate",
    # issue types
    "IssueTypeBase",
    "IssueTypeCreate",
    "IssueTypeResponse",
    "IssueTypeUpdate",
    # workflows
    "StatusCategory",
    "WorkflowBase",
    "WorkflowCreate",
    "WorkflowDetailResponse",
    "WorkflowResponse",
    "WorkflowStatusCreate",
    "WorkflowStatusResponse",
    "WorkflowTransitionCreate",
    "WorkflowTransitionResponse",
    "WorkflowUpdate",
    # issues
    "IssueBase",
    "IssueBrief",
    "IssueBulkResponse",
    "IssueBulkUpdateRequest",
    "IssueCreate",
    "IssueResponse",
    "IssueUpdate",
    # custom fields
    "CustomFieldDefinitionCreate",
    "CustomFieldDefinitionResponse",
    "CustomFieldDefinitionUpdate",
    "CustomFieldValueCreate",
    "CustomFieldValueResponse",
    # issue relations
    "IssueActivityResponse",
    "IssueBriefRef",
    "IssueCommentCreate",
    "IssueCommentResponse",
    "IssueCommentUpdate",
    "IssueLinkCreate",
    "IssueLinkResponse",
    "IssueLinkType",
    # issue extras
    "ComponentCreate",
    "ComponentResponse",
    "ComponentUpdate",
    "FavoriteCreate",
    "FavoriteResponse",
    "LabelCreate",
    "LabelResponse",
    "NotificationResponse",
    "SavedViewCreate",
    "SavedViewResponse",
    "SavedViewUpdate",
    "TaskStatusResponse",
    "TimeEntryCreate",
    "TimeEntryResponse",
    "UploadResponse",
    "VersionCreate",
    "VersionResponse",
    "VersionUpdate",
    # search
    "SearchRequest",
    "SearchResponse",
    "SearchResult",
    # milestones
    "GateApprovalCreate",
    "GateApprovalDecision",
    "GateApprovalResponse",
    "MilestoneCreate",
    "MilestoneResponse",
    "MilestoneUpdate",
    # baselines
    "BaselineCompareResponse",
    "BaselineCreate",
    "BaselineDetailResponse",
    "BaselineResponse",
    "BaselineSnapshotResponse",
    "BaselineVarianceItem",
    # raci
    "RACIAssignmentCreate",
    "RACIAssignmentResponse",
    "RACIBulkUpdate",
    "RACIMatrixResponse",
    "RACIMatrixRow",
    # budget
    "BudgetSummaryResponse",
    "CostEntryCreate",
    "CostEntryResponse",
    "MonthlyBurn",
    "ProjectBudgetCreate",
    "ProjectBudgetResponse",
    "ProjectBudgetUpdate",
    # decisions
    "DecisionCreate",
    "DecisionIssueLinkCreate",
    "DecisionIssueLinkResponse",
    "DecisionResponse",
    "DecisionUpdate",
    # stakeholders
    "StakeholderCreate",
    "StakeholderMatrixEntry",
    "StakeholderMatrixResponse",
    "StakeholderResponse",
    "StakeholderUpdate",
    # roadmap
    "RoadmapPlanCreate",
    "RoadmapPlanProjectCreate",
    "RoadmapPlanProjectResponse",
    "RoadmapPlanResponse",
    "RoadmapPlanUpdate",
    "RoadmapScenarioCreate",
    "RoadmapScenarioOverrideCreate",
    "RoadmapScenarioOverrideResponse",
    "RoadmapScenarioResponse",
    "RoadmapTimelineIssue",
    "RoadmapTimelineItem",
    "RoadmapTimelineResponse",
    # portfolio
    "AffectedProjectDetail",
    "CrossProjectDependencyCreate",
    "CrossProjectDependencyResponse",
    "ImpactAnalysisResponse",
    "PortfolioOverviewResponse",
    "PortfolioProjectResponse",
    "ReleaseCreate",
    "ReleaseProjectCreate",
    "ReleaseProjectResponse",
    "ReleaseResponse",
    "ReleaseUpdate",
    # recurring
    "RecurringRuleCreate",
    "RecurringRuleResponse",
    "RecurringRuleUpdate",
    # sla
    "IssueSLAStatusResponse",
    "SLAPolicyCreate",
    "SLAPolicyResponse",
    "SLAPolicyUpdate",
    # intake
    "IntakeFormCreate",
    "IntakeFormResponse",
    "IntakeFormUpdate",
    "IntakeSubmissionCreate",
    "IntakeSubmissionResponse",
    "IntakeSubmissionReview",
    # approvals
    "ApprovalStepCreate",
    "ApprovalStepResponse",
    "ApprovalStepUpdate",
    "IssueApprovalDecision",
    "IssueApprovalResponse",
    # wiki
    "WikiPageCommentCreate",
    "WikiPageCommentResponse",
    "WikiPageCreate",
    "WikiPageResponse",
    "WikiPageTreeNode",
    "WikiPageUpdate",
    "WikiPageVersionResponse",
    "WikiSearchResult",
    "WikiSpaceCreate",
    "WikiSpaceResponse",
    "WikiSpaceUpdate",
    # dashboard
    "CustomDashboardCreate",
    "CustomDashboardResponse",
    "CustomDashboardUpdate",
    "PersonalDashboardResponse",
    "PortfolioDashboardResponse",
    "ProjectDashboardResponse",
    "ReportDataResponse",
    "RunReportRequest",
    "SavedReportCreate",
    "SavedReportResponse",
    "SavedReportUpdate",
    # automation
    "AutomationExecutionLogResponse",
    "AutomationRuleCreate",
    "AutomationRuleResponse",
    "AutomationRuleUpdate",
    "AutomationTestRequest",
    "AutomationTestResponse",
    # template
    "ProjectTemplateCreate",
    "ProjectTemplateResponse",
    "ProjectTemplateUpdate",
    "ProjectWizardRequest",
    "ProjectWizardResponse",
    # ai
    "AIRiskItem",
    "AIRiskResponse",
    "AISummaryResponse",
    "AITaskRequest",
    "AITaskResponse",
    # import/export
    "ExportRequest",
    "ImportExportTaskResponse",
    "ImportPreviewResponse",
    "ImportRequest",
    # search global
    "SearchParams",
    "SearchResultItem",
]
