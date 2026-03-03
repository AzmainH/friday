import { CheckCircle, AlertCircle } from 'lucide-react'
import { useAutomationLogs } from '@/hooks/useAutomations'
import { formatDateTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecutionLogProps {
  ruleId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExecutionLog({ ruleId }: ExecutionLogProps) {
  const { data: logs, isLoading } = useAutomationLogs(ruleId)

  if (isLoading) {
    return (
      <div className="py-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton-shimmer h-9 rounded mb-1" />
        ))}
      </div>
    )
  }

  const entries = logs ?? []

  if (entries.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-text-secondary">
          No executions recorded yet.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-surface-200 rounded-lg overflow-hidden dark:border-dark-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-50 dark:bg-dark-surface">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Timestamp</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Issue</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Trigger</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Result</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Error</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-surface-50 dark:hover:bg-dark-border/30">
              <td className="px-4 py-2 border-t border-surface-200 dark:border-dark-border">
                <span className="text-sm text-text-primary whitespace-nowrap">
                  {formatDateTime(entry.executed_at)}
                </span>
              </td>
              <td className="px-4 py-2 border-t border-surface-200 dark:border-dark-border">
                <span className="text-sm font-medium text-text-primary">
                  {entry.issue_key}
                </span>
              </td>
              <td className="px-4 py-2 border-t border-surface-200 dark:border-dark-border">
                <span className="text-sm text-text-secondary">
                  {entry.trigger_type.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-4 py-2 border-t border-surface-200 dark:border-dark-border">
                {entry.success ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50 dark:bg-green-500/10 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-red-300 text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    Failed
                  </span>
                )}
              </td>
              <td className="px-4 py-2 border-t border-surface-200 dark:border-dark-border">
                <span className="text-xs text-red-600 dark:text-red-400 block max-w-[260px] truncate">
                  {entry.error_message ?? '\u2014'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
