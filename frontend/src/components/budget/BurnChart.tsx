import { useMemo } from 'react'
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
      <div className="p-8 text-center border border-dashed border-surface-200 rounded-lg">
        <span className="text-text-secondary text-sm">
          No burn data available yet.
        </span>
      </div>
    )
  }

  return (
    <div className="w-full h-[360px]">
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
            stroke="#D84040"
            strokeDasharray="6 4"
            label={{
              value: `Budget: ${formatCurrency(totalBudget)}`,
              position: 'insideTopRight',
              fill: '#D84040',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="spend"
            name="Cumulative Spend"
            stroke="#009688"
            fill="rgba(0, 150, 136, 0.12)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
