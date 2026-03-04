import { cn } from '@/lib/cn'
import type { EVMData } from '@/hooks/useEVM'

interface EVMMetricsProps {
  data: EVMData
}

function indexColor(value: number): string {
  if (value >= 1.0) return 'text-emerald-600 dark:text-emerald-400'
  if (value >= 0.9) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function indexBg(value: number): string {
  if (value >= 1.0) return 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800'
  if (value >= 0.9) return 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800'
  return 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800'
}

function varianceColor(value: number): string {
  if (value >= 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-red-600 dark:text-red-400'
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export default function EVMMetrics({ data }: EVMMetricsProps) {
  return (
    <div className="space-y-4">
      {/* Performance indices */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="SPI"
          sublabel="Schedule Performance"
          value={data.spi.toFixed(2)}
          className={indexBg(data.spi)}
          valueClassName={indexColor(data.spi)}
        />
        <MetricCard
          label="CPI"
          sublabel="Cost Performance"
          value={data.cpi.toFixed(2)}
          className={indexBg(data.cpi)}
          valueClassName={indexColor(data.cpi)}
        />
        <MetricCard
          label="EAC"
          sublabel="Est. at Completion"
          value={formatCurrency(data.eac)}
          className="bg-surface-50 dark:bg-surface-200 border-surface-200"
          valueClassName="text-text-primary"
        />
        <MetricCard
          label="VAC"
          sublabel="Variance at Completion"
          value={formatCurrency(data.vac)}
          className="bg-surface-50 dark:bg-surface-200 border-surface-200"
          valueClassName={varianceColor(data.vac)}
        />
      </div>

      {/* Detail row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniMetric label="BAC (Budget)" value={formatCurrency(data.bac)} />
        <MiniMetric label="Actual Cost" value={formatCurrency(data.ac)} />
        <MiniMetric
          label="Schedule Var."
          value={formatCurrency(data.sv)}
          valueClassName={varianceColor(data.sv)}
        />
        <MiniMetric
          label="Cost Var."
          value={formatCurrency(data.cv)}
          valueClassName={varianceColor(data.cv)}
        />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Progress: {data.percent_complete}% complete</span>
          <span>Planned: {data.planned_percent}%</span>
        </div>
        <div className="h-3 bg-surface-100 dark:bg-surface-200 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${Math.min(data.percent_complete, 100)}%` }}
          />
          {/* Planned marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-surface-500 dark:bg-surface-400"
            style={{ left: `${Math.min(data.planned_percent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-tertiary mt-1">
          <span>
            {data.done_issues}/{data.total_issues} issues
          </span>
          <span>
            {data.completed_milestones}/{data.total_milestones} milestones
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  sublabel,
  value,
  className,
  valueClassName,
}: {
  label: string
  sublabel: string
  value: string
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={cn('rounded-[--radius-md] border p-3', className)}>
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums mt-0.5', valueClassName)}>{value}</p>
      <p className="text-xs text-text-tertiary mt-0.5">{sublabel}</p>
    </div>
  )
}

function MiniMetric({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-200/50 rounded-[--radius-sm] px-3 py-2">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', valueClassName ?? 'text-text-primary')}>
        {value}
      </span>
    </div>
  )
}
