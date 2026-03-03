import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatusCount {
  status: string
  count: number
  color: string
}

export interface IssuesByStatusWidgetProps {
  data: StatusCount[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IssuesByStatusWidget({ data }: IssuesByStatusWidgetProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data])

  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          No status data available
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
        {total} total issues
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="status"
              tick={{ fontSize: 11 }}
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
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value: number) => [value, 'Issues']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}
