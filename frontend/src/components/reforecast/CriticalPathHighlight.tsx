import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import { useCriticalPath, type CriticalPathTask } from '@/hooks/useReforecast'
import { ArrowRight, Calendar, CheckCircle2, Circle, Clock, Route } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Status helpers                                                      */
/* ------------------------------------------------------------------ */

function completionColor(percent: number): string {
  if (percent >= 100) return 'text-green-600 dark:text-green-400'
  if (percent >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-text-secondary dark:text-dark-text-secondary'
}

function CompletionIcon({ percent, className }: { percent: number; className?: string }) {
  if (percent >= 100) {
    return <CheckCircle2 size={16} className={cn('text-green-600 dark:text-green-400', className)} />
  }
  if (percent > 0) {
    return <Clock size={16} className={cn('text-yellow-600 dark:text-yellow-400', className)} />
  }
  return <Circle size={16} className={cn('text-text-tertiary dark:text-dark-text-tertiary', className)} />
}

function formatDate(iso: string | null): string {
  if (!iso) return '--'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

/* ------------------------------------------------------------------ */
/*  Single task card                                                    */
/* ------------------------------------------------------------------ */

interface TaskCardProps {
  task: CriticalPathTask
  index: number
  isLast: boolean
}

function TaskCard({ task, index, isLast }: TaskCardProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Task card */}
      <div
        className={cn(
          'flex-1 rounded-[--radius-md] border border-surface-200 dark:border-surface-100',
          'bg-white dark:bg-dark-surface p-3',
          'hover:border-primary-300 dark:hover:border-primary-700 transition-colors',
        )}
      >
        <div className="flex items-start gap-2.5">
          <CompletionIcon percent={task.percent_complete} className="mt-0.5 shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary truncate">
              {task.summary}
            </p>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary dark:text-dark-text-secondary">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(task.planned_start)}
              </span>
              <span className="text-text-tertiary dark:text-dark-text-tertiary">to</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(task.planned_end)}
              </span>
              <span className="text-text-tertiary dark:text-dark-text-tertiary">
                ({task.duration_days}d)
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-surface-100 dark:bg-surface-200 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    task.percent_complete >= 100
                      ? 'bg-green-500'
                      : task.percent_complete >= 50
                        ? 'bg-yellow-500'
                        : 'bg-primary-500',
                  )}
                  style={{ width: `${Math.min(task.percent_complete, 100)}%` }}
                />
              </div>
              <span className={cn('text-xs font-medium tabular-nums', completionColor(task.percent_complete))}>
                {task.percent_complete}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow connector */}
      {!isLast && (
        <ArrowRight
          size={18}
          className="shrink-0 text-primary-400 dark:text-primary-600"
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

interface CriticalPathHighlightProps {
  projectId: string | undefined
}

export default function CriticalPathHighlight({ projectId }: CriticalPathHighlightProps) {
  const { data, isLoading } = useCriticalPath(projectId)

  const tasks = useMemo(() => data?.tasks ?? [], [data])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-[--radius-md] bg-surface-100 dark:bg-surface-200" />
        ))}
      </div>
    )
  }

  if (!data || tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Route size={32} className="mx-auto mb-2 text-text-tertiary dark:text-dark-text-tertiary" />
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
          No critical path detected. Add dependencies between tasks to see the critical path.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Route size={18} className="text-primary-500" />
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
            Critical Path
          </h3>
          <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-xs font-medium text-text-secondary dark:text-dark-text-secondary bg-surface-50 dark:bg-surface-200 px-2 py-1 rounded">
          Total: {data.total_duration_days} day{data.total_duration_days !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Task chain */}
      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <TaskCard
            key={task.task_id}
            task={task}
            index={idx}
            isLast={idx === tasks.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
