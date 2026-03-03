import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import client from '@/api/client'
import type { Issue } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

interface IssuesResponse {
  data: Issue[]
}

function getDaysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr)
  const now = new Date()
  const diff = now.getTime() - due.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function OverdueWidget() {
  const userId = useAuthStore((s) => s.currentUserId)

  const { data, isLoading } = useQuery<IssuesResponse>({
    queryKey: ['overdue-issues', userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await client.get('/issues', {
        params: {
          assignee_id: userId,
          due_date_before: today,
          status_category: 'todo,in_progress',
          limit: 20,
        },
      })
      return data
    },
    enabled: !!userId,
  })

  const overdueIssues = (data?.data ?? []).filter(
    (issue) => issue.due_date && new Date(issue.due_date) < new Date(),
  )

  return (
    <div className="h-full bg-white dark:bg-surface-100 rounded-[--radius-lg] shadow-sm border border-surface-200 border-l-4 border-l-error p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-error" />
        <h2 className="text-lg font-semibold text-text-primary">Overdue</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-16 skeleton-shimmer rounded-[--radius-sm]" />
          <div className="h-5 skeleton-shimmer rounded-[--radius-xs]" />
          <div className="h-5 skeleton-shimmer rounded-[--radius-xs]" />
        </div>
      ) : overdueIssues.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-5xl font-bold text-success mb-1">0</p>
          <p className="text-sm text-text-secondary">No overdue issues</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <p className="text-5xl font-bold text-error mb-1">
              {overdueIssues.length}
            </p>
            <p className="text-sm text-text-secondary">
              overdue {overdueIssues.length === 1 ? 'issue' : 'issues'}
            </p>
          </div>

          <div className="space-y-1">
            {overdueIssues.slice(0, 5).map((issue) => {
              const days = getDaysOverdue(issue.due_date!)
              return (
                <div
                  key={issue.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <p className="text-sm truncate mr-2 flex-1 text-text-primary">
                    <span className="font-semibold text-primary-600">
                      {issue.issue_key}
                    </span>
                    {' '}
                    {issue.summary}
                  </p>
                  <span className="shrink-0 inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded-full text-xs font-semibold border border-error text-error">
                    {days}d
                  </span>
                </div>
              )
            })}
          </div>

          {overdueIssues.length > 5 && (
            <p className="text-xs text-text-secondary mt-2">
              +{overdueIssues.length - 5} more
            </p>
          )}
        </>
      )}
    </div>
  )
}
