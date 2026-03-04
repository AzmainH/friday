import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { SprintBurndown as SprintBurndownData } from '@/hooks/useSprints'

interface SprintBurndownProps {
  burndown: SprintBurndownData
}

export default function SprintBurndown({ burndown }: SprintBurndownProps) {
  const chartData = useMemo(() => {
    const start = new Date(burndown.start_date)
    const end = new Date(burndown.end_date)
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const totalPoints = burndown.total_points
    const remaining = burndown.remaining_points

    // Build a simple two-point actual line (start -> now) and ideal line (start -> end)
    const points: { day: string; ideal: number; actual: number | null }[] = []

    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const idealRemaining = Math.max(0, totalPoints - (totalPoints / totalDays) * i)

      const now = new Date()
      const isInPast = date <= now

      points.push({
        day: label,
        ideal: Math.round(idealRemaining * 10) / 10,
        actual: isInPast ? (i === 0 ? totalPoints : remaining) : null,
      })
    }

    // For actual line, interpolate linearly from totalPoints at start to remaining at today
    const today = new Date()
    const daysSinceStart = Math.max(
      0,
      Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    )
    const clampedDay = Math.min(daysSinceStart, totalDays)

    return points.map((p, i) => ({
      ...p,
      actual:
        i <= clampedDay
          ? Math.round(
              (totalPoints - ((totalPoints - remaining) / Math.max(1, clampedDay)) * i) * 10,
            ) / 10
          : null,
    }))
  }, [burndown])

  if (burndown.total_points === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-surface-200 rounded-lg">
        <span className="text-text-secondary text-sm">No story points to display.</span>
      </div>
    )
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="ideal"
            name="Ideal"
            stroke="#A3A3A3"
            strokeDasharray="6 4"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#009688"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
