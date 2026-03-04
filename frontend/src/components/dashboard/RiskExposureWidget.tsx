import { AlertTriangle, Shield, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { PortfolioProject } from '@/hooks/usePortfolio'

interface RiskExposureWidgetProps {
  projects: PortfolioProject[]
}

/**
 * Simple risk exposure summary derived from project RAG statuses.
 * In a full implementation this would aggregate actual Risk model data;
 * for now it uses RAG as a proxy for risk level.
 */
export default function RiskExposureWidget({ projects }: RiskExposureWidgetProps) {
  const red = projects.filter((p) => p.rag_status === 'red').length
  const amber = projects.filter((p) => p.rag_status === 'amber').length
  const green = projects.filter((p) => p.rag_status === 'green').length
  const totalOverdue = projects.reduce((acc, p) => acc + p.overdue_issues, 0)

  return (
    <div className="space-y-4">
      {/* Risk level cards */}
      <div className="grid grid-cols-3 gap-3">
        <RiskLevelCard
          icon={<ShieldAlert className="h-4 w-4 text-red-500" />}
          label="High Risk"
          count={red}
          className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
        />
        <RiskLevelCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="At Risk"
          count={amber}
          className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10"
        />
        <RiskLevelCard
          icon={<Shield className="h-4 w-4 text-emerald-500" />}
          label="Healthy"
          count={green}
          className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10"
        />
      </div>

      {/* Overdue summary */}
      {totalOverdue > 0 && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-[--radius-sm] px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{totalOverdue}</strong> overdue issues across{' '}
            {projects.filter((p) => p.overdue_issues > 0).length} projects
          </span>
        </div>
      )}

      {/* Red projects list */}
      {red > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
            Projects at High Risk
          </p>
          <ul className="space-y-1">
            {projects
              .filter((p) => p.rag_status === 'red')
              .map((p) => (
                <li
                  key={p.id}
                  className="text-sm text-text-primary flex items-center justify-between"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-xs text-red-500 shrink-0 ml-2">
                    {p.overdue_issues} overdue
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function RiskLevelCard({
  icon,
  label,
  count,
  className,
}: {
  icon: React.ReactNode
  label: string
  count: number
  className?: string
}) {
  return (
    <div className={cn('rounded-[--radius-md] border p-3 text-center', className)}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-bold tabular-nums text-text-primary">{count}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  )
}
