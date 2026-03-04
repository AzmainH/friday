import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { useProjectStore } from '@/stores/projectStore'
import { useFilterState, type FilterState } from '@/hooks/useFilterState'
import { useProjectMembers, useLabels } from '@/hooks/useProjectSettings'
import ViewSwitcher, { type ViewType } from '@/components/views/ViewSwitcher'
import SavedViewSelector from '@/components/views/SavedViewSelector'
import FilterBar from '@/components/views/FilterBar'
import IssueCreateModal from '@/components/issue/IssueCreateModal'
import IssueDetailPanel from '@/components/issue/IssueDetailPanel'

// ---------------------------------------------------------------------------
// Lazy-loaded view panels
// ---------------------------------------------------------------------------

const TimelineView = lazy(() => import('@/pages/project/TimelineView'))

const BoardView = lazy(() => import('@/pages/project/BoardView'))
const TableView = lazy(() => import('@/pages/project/TableView'))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidView(v: string | null): v is ViewType {
  return v === 'board' || v === 'table' || v === 'timeline'
}

function ViewFallback() {
  return (
    <div className="flex justify-center py-16">
      <div className="skeleton-shimmer h-8 w-8 rounded-full" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectIssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentProject = useProjectStore((s) => s.currentProject)
  const statuses = useProjectStore((s) => s.statuses)
  const issueTypes = useProjectStore((s) => s.issueTypes)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailIssueId, setDetailIssueId] = useState<string | null>(null)

  const projectId = currentProject?.id
  const { data: members = [] } = useProjectMembers(projectId)
  const { data: labels = [] } = useLabels(projectId)

  const memberUsers = useMemo(
    () => members.filter((m) => m.user).map((m) => m.user!),
    [members],
  )

  // ---- View state from URL ----
  const rawView = searchParams.get('view')
  const currentView: ViewType = isValidView(rawView) ? rawView : 'board'

  const handleViewChange = useCallback(
    (view: ViewType) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('view', view)
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  // ---- Filter state from URL ----
  const { filters, setFilter, clearFilters } = useFilterState()

  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilter(key, value)
    },
    [setFilter],
  )

  const handleOpenCreate = useCallback(() => setCreateModalOpen(true), [])
  const handleIssueClick = useCallback((id: string) => setDetailIssueId(id), [])
  const handleDetailClose = useCallback(() => setDetailIssueId(null), [])

  // ---- Active view panel ----
  const viewPanel = useMemo(() => {
    switch (currentView) {
      case 'timeline':
        return <TimelineView onIssueClick={handleIssueClick} />
      case 'table':
        return <TableView onIssueClick={handleIssueClick} />
      case 'board':
      default:
        return <BoardView onAddIssue={handleOpenCreate} onIssueClick={handleIssueClick} />
    }
  }, [currentView, handleOpenCreate, handleIssueClick])

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      {/* ---- Toolbar row ---- */}
      <div className="mb-2 flex flex-wrap items-center gap-4">
        <h2 className="mr-auto text-xl font-semibold text-text-primary">
          {currentProject?.name ?? 'Issues'}
        </h2>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus size={16} className="-ml-0.5" />
          Create Issue
        </Button>

        <ViewSwitcher
          currentView={currentView}
          onViewChange={handleViewChange}
        />

        {currentProject && (
          <SavedViewSelector
            projectId={currentProject.id}
            currentFilters={filters}
            currentView={currentView}
          />
        )}
      </div>

      {/* ---- Filter bar ---- */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        statuses={statuses}
        issueTypes={issueTypes}
        onClearAll={clearFilters}
      />

      <Divider className="my-2" />

      {/* ---- Active view ---- */}
      <div className="min-h-0 flex-1 overflow-auto">
        <Suspense fallback={<ViewFallback />}>{viewPanel}</Suspense>
      </div>

      {/* ---- Create Issue modal ---- */}
      {projectId && (
        <IssueCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          projectId={projectId}
          members={memberUsers}
          labels={labels}
        />
      )}

      {/* ---- Issue detail slide-over ---- */}
      <IssueDetailPanel
        issueId={detailIssueId}
        open={detailIssueId !== null}
        onClose={handleDetailClose}
      />
    </div>
  )
}
