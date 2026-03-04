import { cn } from '@/lib/cn'
import type { UtilizationMember } from '@/hooks/useResourcePlanning'

interface UtilizationChartProps {
  data: UtilizationMember[]
}

function statusColor(status: string): string {
  switch (status) {
    case 'over':
      return 'bg-red-500'
    case 'optimal':
      return 'bg-emerald-500'
    case 'under':
      return 'bg-amber-400'
    default:
      return 'bg-surface-300'
  }
}

function statusBgColor(status: string): string {
  switch (status) {
    case 'over':
      return 'bg-red-100 dark:bg-red-900/20'
    case 'optimal':
      return 'bg-emerald-100 dark:bg-emerald-900/20'
    case 'under':
      return 'bg-amber-100 dark:bg-amber-900/20'
    default:
      return 'bg-surface-100'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'over':
      return 'Over-allocated'
    case 'optimal':
      return 'Optimal'
    case 'under':
      return 'Under-utilized'
    default:
      return status
  }
}

export default function UtilizationChart({ data }: UtilizationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-text-secondary py-8 text-center">
        No team members found in this workspace.
      </div>
    )
  }

  const maxPercent = Math.max(100, ...data.map((d) => d.utilization_percent))

  return (
    <div className="space-y-3">
      {data.map((member) => {
        const barWidth = Math.min((member.utilization_percent / maxPercent) * 100, 100)

        return (
          <div key={member.user_id} className="flex items-center gap-4">
            {/* Name */}
            <div className="w-40 truncate text-sm font-medium text-text-primary" title={member.display_name}>
              {member.display_name}
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div className="h-7 rounded-[--radius-sm] bg-surface-100 dark:bg-surface-200 overflow-hidden">
                <div
                  className={cn('h-full rounded-[--radius-sm] transition-all', statusColor(member.status))}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              {/* 100% marker line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-surface-400 dark:bg-surface-300"
                style={{ left: `${(100 / maxPercent) * 100}%` }}
              />
            </div>

            {/* Percentage + badge */}
            <div className="flex items-center gap-2 w-40 justify-end">
              <span className="text-sm font-semibold tabular-nums text-text-primary">
                {member.utilization_percent}%
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  statusBgColor(member.status),
                  member.status === 'over' && 'text-red-700 dark:text-red-300',
                  member.status === 'optimal' && 'text-emerald-700 dark:text-emerald-300',
                  member.status === 'under' && 'text-amber-700 dark:text-amber-300',
                )}
              >
                {statusLabel(member.status)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
