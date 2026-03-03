import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          No issues tracked yet
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
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
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {percent}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Complete
        </Typography>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        {chartData.map((entry, index) => (
          <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: COLORS[index],
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {entry.name} ({entry.value})
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
