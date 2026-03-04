import { cn } from '@/lib/cn'

interface StatusMapperProps {
  statuses: string[]
  mapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
}

const WORKFLOW_CATEGORIES = [
  { value: 'to_do', label: 'To Do', color: 'bg-surface-200 text-text-secondary' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_review', label: 'In Review', color: 'bg-purple-100 text-purple-700' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-700' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-700' },
]

export function getDefaultStatusMapping(statuses: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const status of statuses) {
    const lower = status.toLowerCase().trim()
    if (lower === 'complete' || lower === 'completed' || lower === 'done') {
      mapping[status] = 'done'
    } else if (
      lower === 'in progress' ||
      lower === 'active' ||
      lower === 'in-progress' ||
      lower === 'wip'
    ) {
      mapping[status] = 'in_progress'
    } else if (
      lower === 'planned' ||
      lower === 'not started' ||
      lower === 'to do' ||
      lower === 'todo' ||
      lower === 'open' ||
      lower === 'new'
    ) {
      mapping[status] = 'to_do'
    } else if (lower === 'blocked' || lower === 'on hold' || lower === 'on-hold') {
      mapping[status] = 'blocked'
    } else if (lower === 'in review' || lower === 'review' || lower === 'pending review') {
      mapping[status] = 'in_review'
    } else {
      mapping[status] = 'to_do'
    }
  }
  return mapping
}

export default function StatusMapper({ statuses, mapping, onMappingChange }: StatusMapperProps) {
  const handleChange = (docStatus: string, category: string) => {
    onMappingChange({
      ...mapping,
      [docStatus]: category,
    })
  }

  if (statuses.length === 0) {
    return (
      <div className="text-sm text-text-secondary text-center py-4">
        No statuses found in the documents.
      </div>
    )
  }

  return (
    <div className="border border-surface-200 rounded-[--radius-md] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
              Document Status
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
              Maps to Workflow Category
            </th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((status) => {
            const currentCategory = mapping[status] ?? 'to_do'
            const categoryInfo = WORKFLOW_CATEGORIES.find((c) => c.value === currentCategory)

            return (
              <tr
                key={status}
                className="border-t border-surface-200 hover:bg-surface-50/50"
              >
                <td className="px-4 py-2.5">
                  <span className="font-medium text-text-primary">{status}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">&#8594;</span>
                    <select
                      value={currentCategory}
                      onChange={(e) => handleChange(status, e.target.value)}
                      className={cn(
                        'px-2.5 py-1.5 text-sm rounded-[--radius-sm]',
                        'border border-surface-300 bg-white dark:bg-dark-surface',
                        'text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30',
                      )}
                    >
                      {WORKFLOW_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {categoryInfo && (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          categoryInfo.color,
                        )}
                      >
                        {categoryInfo.label}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
