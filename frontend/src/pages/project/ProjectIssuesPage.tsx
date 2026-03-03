import { lazy, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import { useProjectStore } from '@/stores/projectStore'
import { useFilterState, type FilterState } from '@/hooks/useFilterState'
import ViewSwitcher, { type ViewType } from '@/components/views/ViewSwitcher'
import SavedViewSelector from '@/components/views/SavedViewSelector'
import FilterBar from '@/components/views/FilterBar'

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
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
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

  // ---- Active view panel ----
  // TimelineView accepts filter props; BoardView and TableView manage their
  // own internal state so we render them without extra props.
  const viewPanel = useMemo(() => {
    switch (currentView) {
      case 'timeline':
        return (
          <TimelineView
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
        )
      case 'table':
        return <TableView />
      case 'board':
      default:
        return <BoardView />
    }
  }, [currentView, filters, handleFilterChange, clearFilters])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: { xs: 2, md: 3 },
      }}
    >
      {/* ---- Toolbar row ---- */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mb: 1, flexWrap: 'wrap' }}
      >
        <Typography variant="h5" sx={{ mr: 'auto' }}>
          {currentProject?.name ?? 'Issues'}
        </Typography>

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
      </Stack>

      {/* ---- Filter bar ---- */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        statuses={statuses}
        issueTypes={issueTypes}
        onClearAll={clearFilters}
      />

      <Divider sx={{ my: 1 }} />

      {/* ---- Active view ---- */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Suspense fallback={<ViewFallback />}>{viewPanel}</Suspense>
      </Box>
    </Box>
  )
}
