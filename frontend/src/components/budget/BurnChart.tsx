import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonthlyBurnPoint {
  month: string // e.g. "Jan 2025" or "2025-01"
  amount: number
}

interface BurnChartProps {
  monthlyBurn: MonthlyBurnPoint[]
  totalBudget: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BurnChart({ monthlyBurn, totalBudget }: BurnChartProps) {
  const chartData = useMemo(() => {
    let cumulative = 0
    return monthlyBurn.map((point) => {
      cumulative += point.amount
      return {
        month: point.month,
        spend: cumulative,
        budget: totalBudget,
      }
    })
  }, [monthlyBurn, totalBudget])

  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">
          No burn data available yet.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 24, bottom: 8, left: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 12 }}
            width={90}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label: string) => label}
          />
          <ReferenceLine
            y={totalBudget}
            stroke="#d32f2f"
            strokeDasharray="6 4"
            label={{
              value: `Budget: ${formatCurrency(totalBudget)}`,
              position: 'insideTopRight',
              fill: '#d32f2f',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="spend"
            name="Cumulative Spend"
            stroke="#1976d2"
            fill="rgba(25, 118, 210, 0.15)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}
