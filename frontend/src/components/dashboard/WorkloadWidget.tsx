import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkloadEntry {
  user: string
  hours: number
  capacity: number
}

export interface WorkloadWidgetProps {
  data: WorkloadEntry[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLOR_ERROR = '#ef4444'
const COLOR_WARNING = '#f59e0b'
const COLOR_PRIMARY = '#f59e0b'
const COLOR_TEXT_SECONDARY = 'var(--color-text-secondary, #78716c)'
const COLOR_DIVIDER = 'var(--color-surface-200, #e7e5e4)'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkloadWidget({ data }: WorkloadWidgetProps) {
  const enrichedData = useMemo(
    () =>
      data.map((entry) => ({
        ...entry,
        utilization: entry.capacity > 0 ? Math.round((entry.hours / entry.capacity) * 100) : 0,
      })),
    [data],
  )

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-text-secondary">No workload data available</p>
      </div>
    )
  }

  // If many users, use compact list view; otherwise use bar chart
  if (data.length > 8) {
    return (
      <div className="w-full h-full overflow-auto">
        {enrichedData.map((entry) => {
          const overloaded = entry.utilization > 100
          const color = overloaded
            ? COLOR_ERROR
            : entry.utilization > 80
              ? COLOR_WARNING
              : COLOR_PRIMARY
          return (
            <div key={entry.user} className="mb-2">
              <div className="flex justify-between mb-0.5">
                <span className="text-xs font-medium truncate">
                  {entry.user}
                </span>
                <span
                  className="text-xs"
                  style={{ color: overloaded ? COLOR_ERROR : COLOR_TEXT_SECONDARY }}
                >
                  {entry.hours}h / {entry.capacity}h
                </span>
              </div>
              <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(entry.utilization, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function barColor(utilization: number): string {
    if (utilization > 100) return COLOR_ERROR
    if (utilization > 80) return COLOR_WARNING
    return COLOR_PRIMARY
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={enrichedData} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="user"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            label={{
              value: 'Hours',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 10, fill: COLOR_TEXT_SECONDARY },
            }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value: number, _name: string, props: { payload?: { capacity: number } }) => {
              const cap = props.payload?.capacity ?? 0
              return [`${value}h / ${cap}h capacity`, 'Workload']
            }}
          />
          <ReferenceLine y={0} stroke={COLOR_DIVIDER} />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {enrichedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColor(entry.utilization)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
