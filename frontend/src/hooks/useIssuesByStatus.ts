import { useQuery } from '@tanstack/react-query'
import { listIssues } from '@/api/issues'
import type { Issue, CursorPage } from '@/types/api'

/**
 * Fetches all issues for a project and groups them by status_id.
 * Returns a Map<string, Issue[]> keyed by status_id with issues
 * sorted by sort_order within each group.
 */
export function useIssuesByStatus(projectId: string | undefined) {
  const query = useQuery<CursorPage<Issue>, Error, Map<string, Issue[]>>({
    queryKey: ['issues', 'board', projectId],
    queryFn: () =>
      listIssues({
        project_id: projectId!,
        limit: 500,
        sort_by: 'sort_order',
        sort_order: 'asc',
      }),
    enabled: !!projectId,
    select: (page) => {
      const grouped = new Map<string, Issue[]>()
      for (const issue of page.data) {
        const existing = grouped.get(issue.status_id)
        if (existing) {
          existing.push(issue)
        } else {
          grouped.set(issue.status_id, [issue])
        }
      }
      // Sort issues within each column by sort_order
      for (const [, issues] of grouped) {
        issues.sort((a, b) => a.sort_order - b.sort_order)
      }
      return grouped
    },
  })

  return {
    columns: query.data ?? new Map<string, Issue[]>(),
    isLoading: query.isLoading,
    error: query.error,
  }
}
