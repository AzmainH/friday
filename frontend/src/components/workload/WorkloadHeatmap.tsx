import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
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

// ---- Custom tooltip ----

interface TooltipPayloadEntry {
  name: string
  value: number
  payload: {
    user: string
    week: string
    allocated: number
    capacity: number
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}

function HeatmapTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0].payload

  const ratio = entry.capacity > 0 ? entry.allocated / entry.capacity : 0
  const statusText =
    ratio > 1
      ? 'Over-allocated'
      : ratio > 0.8
        ? 'Near capacity'
        : 'Available'
  const statusColor =
    ratio > 1 ? '#f44336' : ratio > 0.8 ? '#ff9800' : '#4caf50'

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
        boxShadow: 2,
        minWidth: 160,
      }}
    >
      <Typography variant="subtitle2">{entry.user}</Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        Week of {entry.week}
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2">
          Allocated: <strong>{formatHours(entry.allocated)}</strong>
        </Typography>
        <Typography variant="body2">
          Capacity: <strong>{formatHours(entry.capacity)}</strong>
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: statusColor, fontWeight: 600, mt: 0.5 }}
        >
          {statusText} ({Math.round(ratio * 100)}%)
        </Typography>
      </Box>
    </Box>
  )
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
    <Box sx={{ overflowX: 'auto' }}>
      {/* Header row: weeks */}
      <Box sx={{ display: 'flex', ml: '140px', mb: 0.5 }}>
        {weekLabels.map((label, i) => (
          <Box
            key={i}
            sx={{
              width: 64,
              minWidth: 64,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Data rows */}
      {gridData.map((row, rowIdx) => (
        <Box key={rowIdx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          {/* User name */}
          <Box sx={{ width: 140, minWidth: 140, pr: 1 }}>
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.8rem',
              }}
            >
              {entries[rowIdx].display_name}
            </Typography>
          </Box>

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
              <RechartsTooltip
                key={colIdx}
                content={<HeatmapTooltip />}
              >
                <Box
                  sx={{
                    width: 64,
                    minWidth: 64,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: color,
                    borderRadius: 0.5,
                    mx: '1px',
                    cursor: 'default',
                    position: 'relative',
                    transition: 'opacity 0.15s',
                    '&:hover': { opacity: 0.8 },
                  }}
                  title={`${cell.user} | ${cell.week}\n${formatHours(cell.allocated)} / ${formatHours(cell.capacity)} (${ratio}%)`}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: cell.allocated > 0 ? '#fff' : 'text.disabled',
                    }}
                  >
                    {cell.allocated > 0 ? formatHours(cell.allocated) : ''}
                  </Typography>
                </Box>
              </RechartsTooltip>
            )
          })}
        </Box>
      ))}

      {/* Color legend */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 2, ml: '140px', flexWrap: 'wrap' }}>
        {[
          { label: '0%', color: '#e0e0e0' },
          { label: '<50%', color: '#c8e6c9' },
          { label: '50-70%', color: '#a5d6a7' },
          { label: '70-90%', color: '#81c784' },
          { label: '90-100%', color: '#66bb6a' },
          { label: '>100%', color: '#ffb74d' },
          { label: '>120%', color: '#f44336' },
        ].map(({ label, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: 0.5,
                bgcolor: color,
              }}
            />
            <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
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
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Total Allocation by Team Member
      </Typography>
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
          <Bar dataKey="capacity" fill="#e0e0e0" name="capacity" barSize={20} />
          <Bar dataKey="allocated" name="allocated" barSize={20}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.allocated > entry.capacity
                    ? '#f44336'
                    : entry.allocated > entry.capacity * 0.8
                      ? '#ff9800'
                      : '#4caf50'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

// ---- Main component ----

export default function WorkloadHeatmap({ projectId }: WorkloadHeatmapProps) {
  const { data, isLoading, isError } = useWorkload(projectId)

  if (isError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load workload data. Please try again.
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
      </Box>
    )
  }

  if (!data || data.entries.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No workload data available. Assign issues with estimated hours to team members.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Workload Heatmap
      </Typography>

      {/* Heatmap grid */}
      <HeatmapGrid entries={data.entries} weeks={data.weeks} />

      {/* Summary bar chart */}
      <WorkloadBarChart entries={data.entries} />
    </Box>
  )
}
