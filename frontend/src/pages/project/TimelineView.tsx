import { type FC } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listIssues } from '@/api/issues'
import { updateIssue } from '@/api/issues'
import { useProjectStore } from '@/stores/projectStore'
import type { FilterState } from '@/hooks/useFilterState'
import IssueTimeline from '@/components/gantt/IssueTimeline'
import FilterBar from '@/components/views/FilterBar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineViewProps {
  filters: FilterState
  onFilterChange: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => void
  onClearFilters: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TimelineView: FC<TimelineViewProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const currentProject = useProjectStore((s) => s.currentProject)
  const statuses = useProjectStore((s) => s.statuses)
  const issueTypes = useProjectStore((s) => s.issueTypes)
  const queryClient = useQueryClient()

  const projectId = currentProject?.id ?? ''

  // Fetch issues (first page with a large limit for the timeline)
  const {
    data: issuesPage,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['issues', projectId, filters],
    queryFn: () =>
      listIssues({
        project_id: projectId,
        limit: 200,
        status_id: filters.statusIds.length === 1 ? filters.statusIds[0] : undefined,
        assignee_id:
          filters.assigneeIds.length === 1
            ? filters.assigneeIds[0]
            : undefined,
        priority:
          filters.priorities.length === 1 ? filters.priorities[0] : undefined,
        search: filters.search || undefined,
      }),
    enabled: Boolean(projectId),
  })

  // Client-side filtering for multi-value filters the API doesn't support
  const issues = (issuesPage?.data ?? []).filter((issue) => {
    if (
      filters.statusIds.length > 1 &&
      !filters.statusIds.includes(issue.status_id)
    ) {
      return false
    }
    if (
      filters.assigneeIds.length > 1 &&
      issue.assignee_id &&
      !filters.assigneeIds.includes(issue.assignee_id)
    ) {
      return false
    }
    if (
      filters.priorities.length > 1 &&
      !filters.priorities.includes(issue.priority)
    ) {
      return false
    }
    if (filters.dateRange) {
      const start = issue.start_date ?? issue.created_at
      if (start && start < filters.dateRange.from) return false
      const end = issue.due_date ?? issue.start_date ?? issue.created_at
      if (end && end > filters.dateRange.to) return false
    }
    return true
  })

  // Mutation to update issue dates on drag
  const updateDatesMutation = useMutation({
    mutationFn: ({
      issueId,
      startDate,
      endDate,
    }: {
      issueId: string
      startDate: string
      endDate: string
    }) =>
      updateIssue(issueId, {
        start_date: startDate,
        due_date: endDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
  })

  const handleTaskUpdate = (id: string, startDate: string, endDate: string) => {
    updateDatesMutation.mutate({ issueId: id, startDate, endDate })
  }

  if (!projectId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Select a project to view the timeline.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        statuses={statuses}
        issueTypes={issueTypes}
        onClearAll={onClearFilters}
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ m: 2 }}>
          Failed to load issues{error instanceof Error ? `: ${error.message}` : '.'}
        </Alert>
      )}

      {!isLoading && !isError && issues.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No issues found. Adjust your filters or create new issues.
          </Typography>
        </Box>
      )}

      {!isLoading && !isError && issues.length > 0 && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <IssueTimeline issues={issues} onTaskUpdate={handleTaskUpdate} />
        </Box>
      )}
    </Box>
  )
}

export default TimelineView
