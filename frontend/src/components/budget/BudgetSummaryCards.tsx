import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import type { BudgetSummary } from '@/hooks/useBudget'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usageColor(pct: number): string {
  if (pct >= 95) return '#d32f2f' // red
  if (pct >= 80) return '#ff9800' // amber
  return '#4caf50' // green
}

interface SummaryCardProps {
  label: string
  value: string
  color?: string
}

function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{ flex: '1 1 0', minWidth: 180 }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: color ?? 'text.primary', mt: 0.5 }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
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
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
    </Box>
  )
}
