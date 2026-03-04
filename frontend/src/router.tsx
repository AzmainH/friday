import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/layouts/AppShell'
import ProjectLayout from '@/layouts/ProjectLayout'

// Top-level pages
const HomePage = lazy(() => import('@/pages/HomePageNew'))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))
const PlanningPage = lazy(() => import('@/pages/PlanningPage'))
const RoadmapDetailPage = lazy(() => import('@/pages/RoadmapDetailPage'))
const KnowledgePage = lazy(() => import('@/pages/KnowledgePage'))
const KnowledgePageDetail = lazy(() => import('@/pages/KnowledgePageDetail'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const ResourcePlanningPage = lazy(() => import('@/pages/ResourcePlanningPage'))
const ExecutiveDashboardPage = lazy(() => import('@/pages/ExecutiveDashboardPage'))

// Project-scoped pages
const ProjectIssuesPage = lazy(() => import('@/pages/project/ProjectIssuesPage'))
const BoardView = lazy(() => import('@/pages/project/BoardView'))
const TableView = lazy(() => import('@/pages/project/TableView'))
const TimelineView = lazy(() => import('@/pages/project/TimelineView'))
const MilestonesPage = lazy(() => import('@/pages/project/MilestonesPage'))
const BudgetPage = lazy(() => import('@/pages/project/BudgetPage'))
const DecisionsPage = lazy(() => import('@/pages/project/DecisionsPage'))
const StakeholdersPage = lazy(() => import('@/pages/project/StakeholdersPage'))
const DocumentsPage = lazy(() => import('@/pages/project/DocumentsPage'))
const TimeTrackingPage = lazy(() => import('@/pages/project/TimeTrackingPage'))
const IssueDetailPage = lazy(() => import('@/pages/project/IssueDetailPage'))
const ProjectDashboard = lazy(() => import('@/pages/project/ProjectDashboard'))
const ProjectSettingsPage = lazy(() => import('@/pages/project/SettingsPage'))
const AutomationsPage = lazy(() => import('@/pages/project/AutomationsPage'))
const IntakeFormsPage = lazy(() => import('@/pages/project/IntakeFormsPage'))
const ApprovalsPage = lazy(() => import('@/pages/project/ApprovalsPage'))
const ImportExportPage = lazy(() => import('@/pages/project/ImportExportPage'))
const IntegrationsPage = lazy(() => import('@/pages/project/IntegrationsPage'))
const ProjectCreationWizard = lazy(() => import('@/pages/project/ProjectCreationWizard'))
const DocumentImportWizard = lazy(() => import('@/pages/project/DocumentImportWizard'))
const ProjectReportsPage = lazy(() => import('@/pages/project/ReportsPage'))
const SprintPage = lazy(() => import('@/pages/project/SprintPage'))
const RisksPage = lazy(() => import('@/pages/project/RisksPage'))

function LazyFallback() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-primary-500" />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withSuspense(Component: React.LazyExoticComponent<React.ComponentType<any>>) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: withSuspense(HomePage) },

      // Projects
      { path: 'projects', element: withSuspense(ProjectsPage) },
      { path: 'projects/new', element: withSuspense(ProjectCreationWizard) },
      { path: 'projects/import-documents', element: withSuspense(DocumentImportWizard) },

      // Project-scoped routes (wrapped by ProjectLayout to load project data)
      {
        path: 'projects/:projectId',
        element: <ProjectLayout />,
        children: [
          { index: true, element: withSuspense(BoardView) },
          { path: 'issues', element: withSuspense(ProjectIssuesPage) },
          { path: 'issues/:issueId', element: withSuspense(IssueDetailPage) },
          { path: 'board', element: withSuspense(BoardView) },
          { path: 'table', element: withSuspense(TableView) },
          { path: 'timeline', element: withSuspense(TimelineView) },
          { path: 'milestones', element: withSuspense(MilestonesPage) },
          { path: 'budget', element: withSuspense(BudgetPage) },
          { path: 'decisions', element: withSuspense(DecisionsPage) },
          { path: 'stakeholders', element: withSuspense(StakeholdersPage) },
          { path: 'documents', element: withSuspense(DocumentsPage) },
          { path: 'time-tracking', element: withSuspense(TimeTrackingPage) },
          { path: 'dashboard', element: withSuspense(ProjectDashboard) },
          { path: 'settings', element: withSuspense(ProjectSettingsPage) },
          { path: 'automations', element: withSuspense(AutomationsPage) },
          { path: 'intake', element: withSuspense(IntakeFormsPage) },
          { path: 'approvals', element: withSuspense(ApprovalsPage) },
          { path: 'import-export', element: withSuspense(ImportExportPage) },
          { path: 'integrations', element: withSuspense(IntegrationsPage) },
          { path: 'reports', element: withSuspense(ProjectReportsPage) },
          { path: 'sprints', element: withSuspense(SprintPage) },
          { path: 'risks', element: withSuspense(RisksPage) },
        ],
      },

      // Planning (combined: roadmaps + portfolio + releases)
      { path: 'planning', element: withSuspense(PlanningPage) },
      { path: 'planning/roadmaps/:planId', element: withSuspense(RoadmapDetailPage) },
      { path: 'planning/resources', element: withSuspense(ResourcePlanningPage) },
      { path: 'planning/executive', element: withSuspense(ExecutiveDashboardPage) },

      // Knowledge (wiki)
      { path: 'knowledge', element: withSuspense(KnowledgePage) },
      { path: 'knowledge/:pageId', element: withSuspense(KnowledgePageDetail) },

      // Settings
      { path: 'settings', element: withSuspense(SettingsPage) },

      { path: '*', element: withSuspense(NotFoundPage) },
    ],
  },
])
