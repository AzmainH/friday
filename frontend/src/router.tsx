import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/layouts/AppShell'

// Top-level pages
const HomePage = lazy(() => import('@/pages/HomePageNew'))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))
const PlanningPage = lazy(() => import('@/pages/PlanningPage'))
const RoadmapDetailPage = lazy(() => import('@/pages/RoadmapDetailPage'))
const KnowledgePage = lazy(() => import('@/pages/KnowledgePage'))
const KnowledgePageDetail = lazy(() => import('@/pages/KnowledgePageDetail'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

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
const ProjectDashboard = lazy(() => import('@/pages/project/ProjectDashboard'))
const ProjectSettingsPage = lazy(() => import('@/pages/project/SettingsPage'))
const AutomationsPage = lazy(() => import('@/pages/project/AutomationsPage'))
const IntakeFormsPage = lazy(() => import('@/pages/project/IntakeFormsPage'))
const ApprovalsPage = lazy(() => import('@/pages/project/ApprovalsPage'))
const ImportExportPage = lazy(() => import('@/pages/project/ImportExportPage'))
const ProjectCreationWizard = lazy(() => import('@/pages/project/ProjectCreationWizard'))
const ProjectReportsPage = lazy(() => import('@/pages/project/ReportsPage'))

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

      // Project-scoped routes
      { path: 'projects/:projectId/issues', element: withSuspense(ProjectIssuesPage) },
      { path: 'projects/:projectId/board', element: withSuspense(BoardView) },
      { path: 'projects/:projectId/table', element: withSuspense(TableView) },
      { path: 'projects/:projectId/timeline', element: withSuspense(TimelineView) },
      { path: 'projects/:projectId/milestones', element: withSuspense(MilestonesPage) },
      { path: 'projects/:projectId/budget', element: withSuspense(BudgetPage) },
      { path: 'projects/:projectId/decisions', element: withSuspense(DecisionsPage) },
      { path: 'projects/:projectId/stakeholders', element: withSuspense(StakeholdersPage) },
      { path: 'projects/:projectId/documents', element: withSuspense(DocumentsPage) },
      { path: 'projects/:projectId/time-tracking', element: withSuspense(TimeTrackingPage) },
      { path: 'projects/:projectId/dashboard', element: withSuspense(ProjectDashboard) },
      { path: 'projects/:projectId/settings', element: withSuspense(ProjectSettingsPage) },
      { path: 'projects/:projectId/automations', element: withSuspense(AutomationsPage) },
      { path: 'projects/:projectId/intake', element: withSuspense(IntakeFormsPage) },
      { path: 'projects/:projectId/approvals', element: withSuspense(ApprovalsPage) },
      { path: 'projects/:projectId/import-export', element: withSuspense(ImportExportPage) },
      { path: 'projects/:projectId/reports', element: withSuspense(ProjectReportsPage) },

      // Planning (combined: roadmaps + portfolio + releases)
      { path: 'planning', element: withSuspense(PlanningPage) },
      { path: 'planning/roadmaps/:planId', element: withSuspense(RoadmapDetailPage) },

      // Knowledge (wiki)
      { path: 'knowledge', element: withSuspense(KnowledgePage) },
      { path: 'knowledge/:pageId', element: withSuspense(KnowledgePageDetail) },

      // Settings
      { path: 'settings', element: withSuspense(SettingsPage) },

      { path: '*', element: withSuspense(NotFoundPage) },
    ],
  },
])
