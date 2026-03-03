import { cn } from '@/lib/cn'
import { formatDate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MilestoneItem {
  id: string
  name: string
  due_date: string | null
  status: string
}

export interface MilestoneTimelineWidgetProps {
  milestones: MilestoneItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusChipClasses(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
    case 'in_progress':
    case 'active':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
    case 'at_risk':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
    case 'overdue':
    case 'missed':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
    default:
      return 'bg-surface-50 text-text-secondary border-surface-200'
  }
}

function dotColor(status: string, overdue: boolean): string {
  if (status === 'completed') return 'var(--color-success, #2E9E5A)'
  if (overdue) return 'var(--color-error, #D84040)'
  return 'var(--color-primary-500, #009688)'
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MilestoneTimelineWidget({ milestones }: MilestoneTimelineWidgetProps) {
  if (milestones.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-text-secondary">No milestones to display</p>
      </div>
    )
  }

  // Sort by due_date ascending, nulls last
  const sorted = [...milestones].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-hidden">
      {/* Horizontal timeline */}
      <div
        className="flex items-start relative pt-4"
        style={{ minWidth: sorted.length * 160 }}
      >
        {/* Connecting line */}
        <div className="absolute top-[28px] left-5 right-5 h-0.5 bg-surface-200" />

        {sorted.map((milestone) => {
          const overdue = milestone.status !== 'completed' && isOverdue(milestone.due_date)
          return (
            <div
              key={milestone.id}
              className="flex-none w-[150px] flex flex-col items-center relative px-2"
            >
              {/* Dot */}
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-surface z-[1] mb-2"
                style={{ backgroundColor: dotColor(milestone.status, overdue) }}
              />

              {/* Name */}
              <span className="text-xs font-semibold text-center leading-tight mb-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {milestone.name}
              </span>

              {/* Due date */}
              <span
                className={cn(
                  'text-xs mb-1',
                  overdue ? 'text-error' : 'text-text-secondary',
                )}
              >
                {formatDate(milestone.due_date)}
              </span>

              {/* Status chip */}
              <span
                className={cn(
                  'inline-block px-1.5 py-0.5 text-[0.65rem] font-medium rounded-full border capitalize',
                  statusChipClasses(milestone.status),
                )}
              >
                {milestone.status.replace(/_/g, ' ')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
