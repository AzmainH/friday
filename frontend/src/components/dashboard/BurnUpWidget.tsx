import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BurnUpDataPoint {
  date: string
  total: number
  completed: number
}

export interface BurnUpWidgetProps {
  data: BurnUpDataPoint[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BurnUpWidget({ data }: BurnUpWidgetProps) {
  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          No burn-up data available
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelFormatter={formatDateLabel}
          />
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#7c4dff"
            strokeWidth={2}
            dot={false}
            name="Total Scope"
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#4caf50"
            strokeWidth={2}
            dot={false}
            name="Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
