import { useState } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Milestone as MilestoneIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import EVMMetrics from '@/components/dashboard/EVMMetrics'
import PortfolioHealthGrid from '@/components/dashboard/PortfolioHealthGrid'
import RiskExposureWidget from '@/components/dashboard/RiskExposureWidget'
import UtilizationChart from '@/components/resource/UtilizationChart'
import { useExecutivePortfolio, useUpcomingMilestones } from '@/hooks/useExecutiveDashboard'
import { useProjectEVM } from '@/hooks/useEVM'
import { useUtilizationReport } from '@/hooks/useResourcePlanning'

const WORKSPACE_ID = 'default' // Placeholder until workspace context is wired

export default function ExecutiveDashboardPage() {
  const { data: portfolio, isLoading: loadingPortfolio } = useExecutivePortfolio(WORKSPACE_ID)
  const { data: milestones, isLoading: loadingMilestones } = useUpcomingMilestones(WORKSPACE_ID)
  const { data: utilization, isLoading: loadingUtil } = useUtilizationReport(WORKSPACE_ID, 4)

  // EVM for a selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { data: evmData, isLoading: loadingEvm } = useProjectEVM(selectedProjectId ?? undefined)

  // Auto-select first project when portfolio loads
  if (portfolio && portfolio.projects.length > 0 && !selectedProjectId) {
    setSelectedProjectId(portfolio.projects[0].id)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          Executive Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Portfolio health, EVM metrics, resource utilization, and risk overview.
        </p>
      </div>

      {/* Summary strip */}
      {portfolio && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="Total Projects"
            value={portfolio.summary.total_projects}
          />
          <SummaryCard
            label="Green / Healthy"
            value={portfolio.summary.by_rag.green ?? 0}
            valueClassName="text-emerald-600 dark:text-emerald-400"
          />
          <SummaryCard
            label="At Risk (Amber)"
            value={portfolio.summary.by_rag.amber ?? 0}
            valueClassName="text-amber-600 dark:text-amber-400"
          />
          <SummaryCard
            label="Critical (Red)"
            value={portfolio.summary.by_rag.red ?? 0}
            valueClassName="text-red-600 dark:text-red-400"
          />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Health */}
        <Section title="Portfolio Health" icon={<TrendingUp className="h-5 w-5" />} className="lg:col-span-2">
          {loadingPortfolio ? (
            <LoadingSkeleton rows={3} />
          ) : portfolio ? (
            <PortfolioHealthGrid projects={portfolio.projects} />
          ) : null}
        </Section>

        {/* EVM */}
        <Section title="Earned Value Management" icon={<BarChart3 className="h-5 w-5" />}>
          {/* Project selector */}
          {portfolio && portfolio.projects.length > 0 && (
            <div className="mb-4">
              <select
                value={selectedProjectId ?? ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                className="text-sm bg-surface-50 dark:bg-surface-200 border border-surface-200 rounded-[--radius-sm] px-3 py-1.5 text-text-primary"
              >
                {portfolio.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {loadingEvm ? (
            <LoadingSkeleton rows={4} />
          ) : evmData ? (
            <EVMMetrics data={evmData} />
          ) : (
            <div className="text-sm text-text-secondary py-4 text-center">
              Select a project to view EVM metrics.
            </div>
          )}
        </Section>

        {/* Risk Exposure */}
        <Section title="Risk Exposure" icon={<AlertTriangle className="h-5 w-5" />}>
          {loadingPortfolio ? (
            <LoadingSkeleton rows={3} />
          ) : portfolio ? (
            <RiskExposureWidget projects={portfolio.projects} />
          ) : null}
        </Section>

        {/* Resource Utilization Summary */}
        <Section title="Resource Utilization" icon={<BarChart3 className="h-5 w-5" />}>
          {loadingUtil ? (
            <LoadingSkeleton rows={5} />
          ) : utilization ? (
            <UtilizationChart data={utilization.utilization} />
          ) : null}
        </Section>

        {/* Upcoming Milestones */}
        <Section title="Upcoming Milestones" icon={<MilestoneIcon className="h-5 w-5" />}>
          {loadingMilestones ? (
            <LoadingSkeleton rows={4} />
          ) : milestones && milestones.length > 0 ? (
            <MilestoneList milestones={milestones} />
          ) : (
            <div className="text-sm text-text-secondary py-4 text-center">
              No upcoming milestones.
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string | number
  valueClassName?: string
}) {
  return (
    <div className="bg-white dark:bg-surface-100 rounded-[--radius-md] border border-surface-200 p-4">
      <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums mt-0.5', valueClassName ?? 'text-text-primary')}>
        {value}
      </p>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-100 rounded-[--radius-md] border border-surface-200 p-6',
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
        <span className="text-primary-500">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  )
}

function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-8 rounded" />
      ))}
    </div>
  )
}

function MilestoneList({
  milestones,
}: {
  milestones: {
    id: string
    name: string
    project_name?: string
    due_date: string | null
    status: string
    progress_pct: number
  }[]
}) {
  return (
    <div className="space-y-2">
      {milestones.slice(0, 10).map((ms) => {
        const isOverdue =
          ms.due_date && new Date(ms.due_date) < new Date() && ms.status !== 'completed'

        return (
          <div
            key={ms.id}
            className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{ms.name}</p>
              {ms.project_name && (
                <p className="text-xs text-text-tertiary">{ms.project_name}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              {ms.due_date && (
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    isOverdue ? 'text-red-500 font-medium' : 'text-text-tertiary',
                  )}
                >
                  {new Date(ms.due_date).toLocaleDateString()}
                </span>
              )}
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  ms.status === 'completed' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
                  ms.status === 'in_progress' && 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300',
                  ms.status === 'not_started' && 'bg-surface-100 text-text-secondary',
                  ms.status === 'blocked' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
                )}
              >
                {ms.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
