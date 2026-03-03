import { formatCurrency, formatPercent } from '@/utils/formatters'
import type { BudgetSummary } from '@/hooks/useBudget'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usageColor(pct: number): string {
  if (pct >= 95) return '#ef4444' // red
  if (pct >= 80) return '#f59e0b' // amber
  return '#22c55e' // green
}

interface SummaryCardProps {
  label: string
  value: string
  color?: string
}

function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <div className="flex-1 min-w-[180px] border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span
        className="block text-xl font-bold mt-1"
        style={{ color: color ?? undefined }}
      >
        {value}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BudgetSummaryCardsProps {
  summary: BudgetSummary
}

export default function BudgetSummaryCards({ summary }: BudgetSummaryCardsProps) {
  const pctColor = usageColor(summary.percent_used)

  return (
    <div className="flex gap-4 flex-wrap">
      <SummaryCard label="Total Budget" value={formatCurrency(summary.total_budget)} />
      <SummaryCard label="Spent" value={formatCurrency(summary.total_spent)} />
      <SummaryCard
        label="Remaining"
        value={formatCurrency(summary.remaining)}
        color={pctColor}
      />
      <SummaryCard
        label="% Used"
        value={formatPercent(summary.percent_used)}
        color={pctColor}
      />
    </div>
  )
}
