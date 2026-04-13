import { useState, useMemo } from 'react'
import { cn } from '@/lib/cn'
import { useVarianceAlerts, type VarianceAlert } from '@/hooks/useReforecast'
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  TrendingDown,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Severity styling                                                    */
/* ------------------------------------------------------------------ */

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-300 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-300 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    border: 'border-yellow-300 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-300 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
}

/* ------------------------------------------------------------------ */
/*  Alert type icons                                                    */
/* ------------------------------------------------------------------ */

function AlertTypeIcon({ type, className }: { type: string; className?: string }) {
  const size = 16
  switch (type) {
    case 'overdue':
      return <Clock size={size} className={className} />
    case 'blocker_aged':
      return <ShieldAlert size={size} className={className} />
    case 'critical_path_slip':
      return <TrendingDown size={size} className={className} />
    case 'no_update':
      return <PauseCircle size={size} className={className} />
    default:
      return <AlertTriangle size={size} className={className} />
  }
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  overdue: 'Overdue',
  blocker_aged: 'Blocker Aged',
  critical_path_slip: 'Critical Path Slip',
  no_update: 'No Update',
}

/* ------------------------------------------------------------------ */
/*  Single alert row                                                    */
/* ------------------------------------------------------------------ */

interface AlertRowProps {
  alert: VarianceAlert
  onDismiss: (taskId: string) => void
}

function AlertRow({ alert, onDismiss }: AlertRowProps) {
  const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[--radius-md] border px-3 py-2',
        style.bg,
        style.border,
      )}
    >
      <AlertTypeIcon type={alert.alert_type} className={cn('mt-0.5 shrink-0', style.icon)} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold uppercase tracking-wide', style.text)}>
            {ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
          </span>
          {alert.variance_days != null && (
            <span className={cn('text-xs', style.text)}>
              ({alert.variance_days}d)
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary truncate">
          {alert.task_summary}
        </p>
        <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5">
          {alert.message}
        </p>
      </div>

      <button
        type="button"
        aria-label="Dismiss alert"
        onClick={() => onDismiss(alert.task_id)}
        className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X size={14} className="text-text-tertiary dark:text-dark-text-tertiary" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Banner component                                                    */
/* ------------------------------------------------------------------ */

interface VarianceAlertBannerProps {
  projectId: string | undefined
}

export default function VarianceAlertBanner({ projectId }: VarianceAlertBannerProps) {
  const { data: alerts, isLoading } = useVarianceAlerts(projectId)
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleAlerts = useMemo(
    () => (alerts ?? []).filter((a) => !dismissed.has(a.task_id)),
    [alerts, dismissed],
  )

  const handleDismiss = (taskId: string) => {
    setDismissed((prev) => new Set(prev).add(taskId))
  }

  // Sort by severity: critical > high > medium > low
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const sorted = useMemo(
    () => [...visibleAlerts].sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)),
    [visibleAlerts],
  )

  if (isLoading || sorted.length === 0) return null

  const criticalCount = sorted.filter((a) => a.severity === 'critical').length
  const highCount = sorted.filter((a) => a.severity === 'high').length

  // Determine banner-level colour from most severe alert.
  const topSeverity = sorted[0]?.severity ?? 'low'
  const bannerStyle = SEVERITY_STYLES[topSeverity] ?? SEVERITY_STYLES.low

  return (
    <div
      className={cn(
        'rounded-[--radius-md] border',
        bannerStyle.bg,
        bannerStyle.border,
      )}
    >
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className={bannerStyle.icon} />
          <span className={cn('text-sm font-semibold', bannerStyle.text)}>
            {sorted.length} Variance Alert{sorted.length !== 1 ? 's' : ''}
          </span>
          {criticalCount > 0 && (
            <span className="text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
              {criticalCount} critical
            </span>
          )}
          {highCount > 0 && (
            <span className="text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-1.5 py-0.5 rounded">
              {highCount} high
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={16} className={bannerStyle.icon} />
        ) : (
          <ChevronDown size={16} className={bannerStyle.icon} />
        )}
      </button>

      {/* Collapsible alert list */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {sorted.map((alert) => (
            <AlertRow
              key={`${alert.task_id}-${alert.alert_type}`}
              alert={alert}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  )
}
