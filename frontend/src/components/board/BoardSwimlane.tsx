import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Issue, WorkflowStatus } from '@/types/api'
import BoardColumn from '@/components/board/BoardColumn'

interface BoardSwimlaneProps {
  /** Display label for the swimlane row (e.g. assignee name or priority level) */
  label: string
  /** Ordered list of statuses that define the columns */
  statuses: WorkflowStatus[]
  /** Map of status_id -> issues for this swimlane's slice */
  issuesByStatus: Map<string, Issue[]>
  /** Callback when "+" is clicked in a column header */
  onAddIssue: (statusId: string) => void
}

/**
 * Optional swimlane grouping row for the Kanban board.
 * Renders a collapsible horizontal row with a label header, containing
 * one BoardColumn per workflow status.
 *
 * Swimlanes can be used to group issues by assignee, priority, or any
 * other dimension. The parent component is responsible for slicing the
 * issue data and creating one BoardSwimlane per group.
 */
export default function BoardSwimlane({
  label,
  statuses,
  issuesByStatus,
  onAddIssue,
}: BoardSwimlaneProps) {
  const [expanded, setExpanded] = useState(true)

  // Count total issues across all columns in this swimlane
  let totalIssues = 0
  for (const [, issues] of issuesByStatus) {
    totalIssues += issues.length
  }

  return (
    <div className="border-b border-surface-200 last:border-b-0">
      {/* Swimlane header */}
      <div
        className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-200 cursor-pointer select-none hover:bg-surface-200 dark:hover:bg-surface-300 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <button className="p-0.5">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <span className="text-xs text-text-secondary">
          ({totalIssues} {totalIssues === 1 ? 'issue' : 'issues'})
        </span>
      </div>

      {/* Swimlane body: horizontally scrollable columns */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[2000px]' : 'max-h-0',
        )}
      >
        <div className="flex gap-3 p-3 overflow-x-auto min-h-[120px]">
          {statuses.map((status) => (
            <BoardColumn
              key={status.id}
              status={status}
              issues={issuesByStatus.get(status.id) ?? []}
              onAddIssue={() => onAddIssue(status.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
