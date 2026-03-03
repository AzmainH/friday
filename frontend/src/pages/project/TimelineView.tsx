import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listIssues } from '@/api/issues'
import { updateIssue } from '@/api/issues'
import { useProjectStore } from '@/stores/projectStore'
import { useFilterState } from '@/hooks/useFilterState'
import IssueTimeline from '@/components/gantt/IssueTimeline'
import FilterBar from '@/components/views/FilterBar'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TimelineView() {
  const { filters, setFilter: onFilterChange, clearFilters: onClearFilters } = useFilterState()
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
      const start = issue.planned_start ?? issue.created_at
      if (start && start < filters.dateRange.from) return false
      const end = issue.planned_end ?? issue.planned_start ?? issue.created_at
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
        planned_start: startDate,
        planned_end: endDate,
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
      <div className="p-8 text-center">
        <p className="text-text-secondary">
          Select a project to view the timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        statuses={statuses}
        issueTypes={issueTypes}
        onClearAll={onClearFilters}
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-primary-500" />
        </div>
      )}

      {isError && (
        <div className="mx-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-[--radius-sm]">
          Failed to load issues{error instanceof Error ? `: ${error.message}` : '.'}
        </div>
      )}

      {!isLoading && !isError && issues.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-text-secondary">
            No issues found. Adjust your filters or create new issues.
          </p>
        </div>
      )}

      {!isLoading && !isError && issues.length > 0 && (
        <div className="flex-1 min-h-0">
          <IssueTimeline issues={issues} onTaskUpdate={handleTaskUpdate} />
        </div>
      )}
    </div>
  )
}
