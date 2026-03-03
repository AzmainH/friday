import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { STATUS_CATEGORY_COLORS } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressDonutWidgetProps {
  done: number
  inProgress: number
  todo: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const COLORS = [STATUS_CATEGORY_COLORS.done, STATUS_CATEGORY_COLORS.in_progress, STATUS_CATEGORY_COLORS.todo]

export default function ProgressDonutWidget({ done, inProgress, todo }: ProgressDonutWidgetProps) {
  const total = done + inProgress + todo
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  const chartData = useMemo(
    () => [
      { name: 'Done', value: done },
      { name: 'In Progress', value: inProgress },
      { name: 'To Do', value: todo },
    ],
    [done, inProgress, todo],
  )

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-text-secondary">No issues tracked yet</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            strokeWidth={2}
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <span className="text-xl font-bold leading-none">{percent}%</span>
        <br />
        <span className="text-xs text-text-secondary">Complete</span>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 absolute bottom-0 left-0 right-0">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="text-xs text-text-secondary">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
