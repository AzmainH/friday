import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import { useTheme } from '@mui/material/styles'
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
// Component
// ---------------------------------------------------------------------------

export default function WorkloadWidget({ data }: WorkloadWidgetProps) {
  const theme = useTheme()

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          No workload data available
        </Typography>
      </Box>
    )
  }

  // If many users, use compact list view; otherwise use bar chart
  if (data.length > 8) {
    return (
      <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
        {enrichedData.map((entry) => {
          const overloaded = entry.utilization > 100
          return (
            <Box key={entry.user} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" sx={{ fontWeight: 500 }} noWrap>
                  {entry.user}
                </Typography>
                <Typography
                  variant="caption"
                  color={overloaded ? 'error' : 'text.secondary'}
                >
                  {entry.hours}h / {entry.capacity}h
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(entry.utilization, 100)}
                color={overloaded ? 'error' : entry.utilization > 80 ? 'warning' : 'primary'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )
        })}
      </Box>
    )
  }

  function barColor(utilization: number): string {
    if (utilization > 100) return theme.palette.error.main
    if (utilization > 80) return theme.palette.warning.main
    return theme.palette.primary.main
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
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
              style: { fontSize: 10, fill: theme.palette.text.secondary },
            }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value: number, _name: string, props: { payload: { capacity: number } }) => {
              const cap = props.payload.capacity
              return [`${value}h / ${cap}h capacity`, 'Workload']
            }}
          />
          <ReferenceLine y={0} stroke={theme.palette.divider} />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {enrichedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColor(entry.utilization)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
