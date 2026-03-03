import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useWorkload, getHeatmapColor } from '@/hooks/useWorkload'
import { formatHours } from '@/utils/formatters'

// ---- Props ----

interface WorkloadHeatmapProps {
  projectId: string
}

// ---- Heatmap grid cell component ----

interface HeatmapCellProps {
  user: string
  week: string
  allocated: number
  capacity: number
}

function HeatmapGrid({
  entries,
  weeks,
}: {
  entries: Array<{
    user_id: string
    display_name: string
    weekly_hours: Array<{ week_start: string; allocated_hours: number; capacity_hours: number }>
    capacity_hours_per_week: number
  }>
  weeks: string[]
}) {
  // Transform data into a flat array for the grid
  const gridData = useMemo(() => {
    const rows: HeatmapCellProps[][] = []
    for (const entry of entries) {
      const row: HeatmapCellProps[] = weeks.map((week) => {
        const wh = entry.weekly_hours.find((w) => w.week_start === week)
        return {
          user: entry.display_name,
          week,
          allocated: wh?.allocated_hours ?? 0,
          capacity: wh?.capacity_hours ?? entry.capacity_hours_per_week,
        }
      })
      rows.push(row)
    }
    return rows
  }, [entries, weeks])

  // Format week labels
  const weekLabels = useMemo(
    () =>
      weeks.map((w) => {
        const d = new Date(w)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
    [weeks],
  )

  return (
    <div className="overflow-x-auto">
      {/* Header row: weeks */}
      <div className="flex ml-[140px] mb-1">
        {weekLabels.map((label, i) => (
          <div
            key={i}
            className="w-16 min-w-[64px] text-center"
          >
            <span className="text-text-secondary" style={{ fontSize: '0.65rem' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Data rows */}
      {gridData.map((row, rowIdx) => (
        <div key={rowIdx} className="flex items-center mb-1">
          {/* User name */}
          <div className="w-[140px] min-w-[140px] pr-2">
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm" style={{ fontSize: '0.8rem' }}>
              {entries[rowIdx].display_name}
            </span>
          </div>

          {/* Heatmap cells */}
          {row.map((cell, colIdx) => {
            const color = getHeatmapColor(cell.allocated, cell.capacity)
            const ratio =
              cell.capacity > 0
                ? Math.round((cell.allocated / cell.capacity) * 100)
                : cell.allocated > 0
                  ? 999
                  : 0

            return (
              <div
                key={colIdx}
                className="flex h-9 w-16 min-w-[64px] items-center justify-center rounded mx-px cursor-default relative transition-opacity hover:opacity-80"
                style={{ backgroundColor: color }}
                title={`${cell.user} | ${cell.week}\n${formatHours(cell.allocated)} / ${formatHours(cell.capacity)} (${ratio}%)`}
              >
                <span
                  className="font-semibold"
                  style={{
                    fontSize: '0.65rem',
                    color: cell.allocated > 0 ? '#fff' : 'var(--color-text-disabled, #A3A3A3)',
                  }}
                >
                  {cell.allocated > 0 ? formatHours(cell.allocated) : ''}
                </span>
              </div>
            )
          })}
        </div>
      ))}

      {/* Color legend */}
      <div className="flex flex-wrap gap-3 mt-4 ml-[140px]">
        {[
          { label: '0%', color: '#e7e5e4' },
          { label: '<50%', color: '#c8e6c9' },
          { label: '50-70%', color: '#a5d6a7' },
          { label: '70-90%', color: '#81c784' },
          { label: '90-100%', color: '#66bb6a' },
          { label: '>100%', color: '#ffb74d' },
          { label: '>120%', color: '#D84040' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className="h-3.5 w-3.5 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-text-secondary" style={{ fontSize: '0.65rem' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Stacked bar chart (alternative summary view) ----

function WorkloadBarChart({
  entries,
}: {
  entries: Array<{
    display_name: string
    total_hours: number
    capacity_hours_per_week: number
    weekly_hours: Array<{ allocated_hours: number; capacity_hours: number }>
  }>
}) {
  const chartData = useMemo(
    () =>
      entries.map((e) => ({
        name: e.display_name,
        allocated: e.total_hours,
        capacity: e.weekly_hours.reduce((sum, w) => sum + w.capacity_hours, 0),
      })),
    [entries],
  )

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold mb-2">
        Total Allocation by Team Member
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(entries.length * 40, 200)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={(v: number) => `${v}h`} />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 12 }}
          />
          <RechartsTooltip
            formatter={(value: number, name: string) => [
              formatHours(value),
              name === 'allocated' ? 'Allocated' : 'Capacity',
            ]}
          />
          <Bar dataKey="capacity" fill="#e7e5e4" name="capacity" barSize={20} />
          <Bar dataKey="allocated" name="allocated" barSize={20}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.allocated > entry.capacity
                    ? '#D84040'
                    : entry.allocated > entry.capacity * 0.8
                      ? '#E8A317'
                      : '#2E9E5A'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---- Main component ----

export default function WorkloadHeatmap({ projectId }: WorkloadHeatmapProps) {
  const { data, isLoading, isError } = useWorkload(projectId)

  if (isError) {
    return (
      <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Failed to load workload data. Please try again.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="skeleton-shimmer h-[250px] rounded-lg" />
      </div>
    )
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-text-secondary">
          No workload data available. Assign issues with estimated hours to team members.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">
        Workload Heatmap
      </h2>

      {/* Heatmap grid */}
      <HeatmapGrid entries={data.entries} weeks={data.weeks} />

      {/* Summary bar chart */}
      <WorkloadBarChart entries={data.entries} />
    </div>
  )
}
