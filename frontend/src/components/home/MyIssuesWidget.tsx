import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import client from '@/api/client'
import type { Issue } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, PRIORITY_COLORS } from '@/utils/formatters'

interface IssuesResponse {
  data: Issue[]
}

export default function MyIssuesWidget() {
  const [tab, setTab] = useState(0)
  const userId = useAuthStore((s) => s.currentUserId)

  const paramKey = tab === 0 ? 'assignee_id' : 'reporter_id'

  const { data, isLoading } = useQuery<IssuesResponse>({
    queryKey: ['my-issues', paramKey, userId],
    queryFn: async () => {
      const { data } = await client.get('/issues', {
        params: { [paramKey]: userId, limit: 10 },
      })
      return data
    },
    enabled: !!userId,
  })

  const issues = data?.data ?? []

  const tabs = ['Assigned to me', 'Reported by me']

  return (
    <div className="h-full bg-white dark:bg-surface-100 rounded-[--radius-lg] shadow-sm border border-surface-200">
      <div className="px-5 pt-5 pb-0">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          My Issues
        </h2>

        {/* Custom tabs */}
        <div className="flex border-b border-surface-200">
          {tabs.map((label, i) => (
            <button
              key={label}
              onClick={() => setTab(i)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors duration-[--duration-fast] cursor-pointer',
                'border-b-2 -mb-px',
                tab === i
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-7 skeleton-shimmer rounded-[--radius-xs]" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-text-secondary">No issues found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Key
                </th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Summary
                </th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-b border-surface-200 last:border-b-0 hover:bg-surface-50 cursor-pointer transition-colors duration-[--duration-fast]"
                >
                  <td className="px-5 py-2.5">
                    <span className="font-medium text-primary-600">
                      {issue.issue_key}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="block max-w-[250px] truncate text-text-primary">
                      {issue.summary}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{
                        backgroundColor: issue.status?.color ?? '#9e9e9e',
                      }}
                    >
                      {issue.status?.name ?? 'Unknown'}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium border"
                      style={{
                        borderColor:
                          PRIORITY_COLORS[issue.priority] ?? '#9e9e9e',
                        color:
                          PRIORITY_COLORS[issue.priority] ?? '#9e9e9e',
                      }}
                    >
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-text-secondary">
                    {formatDate(issue.due_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
