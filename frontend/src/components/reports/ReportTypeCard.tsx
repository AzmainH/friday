import type { LucideIcon } from 'lucide-react'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Layers,
  Clock,
  BarChart3,
  Users,
  FileBarChart,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ReportType } from '@/hooks/useReports'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportTypeCardProps {
  type: ReportType
  selected?: boolean
  onClick: (type: ReportType) => void
}

interface ReportTypeMeta {
  label: string
  description: string
  icon: LucideIcon
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const REPORT_TYPE_META: Record<ReportType, ReportTypeMeta> = {
  velocity: {
    label: 'Velocity',
    description: 'Story points completed per sprint or period',
    icon: TrendingUp,
  },
  burndown: {
    label: 'Burndown',
    description: 'Remaining work over time vs ideal pace',
    icon: TrendingDown,
  },
  burnup: {
    label: 'Burn Up',
    description: 'Scope vs completed work over time',
    icon: ArrowUpRight,
  },
  cumulative_flow: {
    label: 'Cumulative Flow',
    description: 'Issue distribution by status over time',
    icon: Layers,
  },
  cycle_time: {
    label: 'Cycle Time',
    description: 'Time from start to completion per issue',
    icon: Clock,
  },
  throughput: {
    label: 'Throughput',
    description: 'Issues completed per time period',
    icon: BarChart3,
  },
  workload: {
    label: 'Workload',
    description: 'Issue count per team member',
    icon: Users,
  },
  custom: {
    label: 'Custom',
    description: 'Build a custom report query',
    icon: FileBarChart,
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportTypeCard({ type, selected = false, onClick }: ReportTypeCardProps) {
  const meta = REPORT_TYPE_META[type]
  const Icon = meta.icon

  return (
    <button
      type="button"
      onClick={() => onClick(type)}
      className={cn(
        'flex flex-col items-start gap-2 p-4 rounded-[--radius-md] border text-left transition-all duration-150',
        'hover:shadow-md hover:-translate-y-px',
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
          : 'border-surface-200 bg-white dark:bg-dark-surface hover:border-primary-300',
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5',
          selected ? 'text-primary-600 dark:text-primary-400' : 'text-text-secondary',
        )}
      />
      <div>
        <span
          className={cn(
            'text-sm font-semibold block',
            selected ? 'text-primary-700 dark:text-primary-300' : 'text-text-primary',
          )}
        >
          {meta.label}
        </span>
        <span className="text-xs text-text-secondary leading-tight block mt-0.5">
          {meta.description}
        </span>
      </div>
    </button>
  )
}

export { REPORT_TYPE_META }
