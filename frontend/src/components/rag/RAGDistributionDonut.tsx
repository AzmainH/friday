import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { RAG_COLORS } from '@/utils/formatters'

// ---- Types ----

interface RAGDistributionData {
  green: number
  amber: number
  red: number
}

// ---- Props ----

interface RAGDistributionDonutProps {
  data: RAGDistributionData
}

// ---- Chart colors ----

const SEGMENT_CONFIG: { key: keyof RAGDistributionData; label: string; color: string }[] = [
  { key: 'green', label: 'Green', color: RAG_COLORS.green },
  { key: 'amber', label: 'Amber', color: RAG_COLORS.amber },
  { key: 'red', label: 'Red', color: RAG_COLORS.red },
]

// ---- Custom tooltip ----

interface TooltipPayloadEntry {
  name: string
  value: number
  payload: { name: string; value: number; fill: string }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}

function DonutTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        boxShadow: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: entry.payload.fill,
          }}
        />
        <Typography variant="body2" fontWeight={600}>
          {entry.name}: {entry.value}
        </Typography>
      </Box>
    </Box>
  )
}

// ---- Custom center label ----

interface CenterLabelProps {
  cx: number
  cy: number
  total: number
}

function CenterLabel({ cx, cy, total }: CenterLabelProps) {
  return (
    <>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 24, fontWeight: 700, fill: '#333' }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 11, fill: '#999' }}
      >
        projects
      </text>
    </>
  )
}

// ---- Component ----

export default function RAGDistributionDonut({ data }: RAGDistributionDonutProps) {
  const total = data.green + data.amber + data.red

  const chartData = SEGMENT_CONFIG
    .map(({ key, label, color }) => ({
      name: label,
      value: data[key],
      fill: color,
    }))
    .filter((d) => d.value > 0)

  if (total === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No RAG status data available.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ width: '100%', height: 220, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
            {/* Render center label using a second invisible Pie to get cx/cy */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={0}
              dataKey="value"
              isAnimationActive={false}
              label={({ cx, cy }) => (
                <CenterLabel cx={cx} cy={cy} total={total} />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Legend below chart */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
          mt: 1,
        }}
      >
        {SEGMENT_CONFIG.map(({ key, label, color }) => (
          <Box
            key={key}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: color,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {data[key]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
