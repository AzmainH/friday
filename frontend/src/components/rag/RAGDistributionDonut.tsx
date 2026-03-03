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
    <div className="border border-surface-200 rounded bg-white p-2 shadow-md dark:bg-dark-surface dark:border-dark-border">
      <div className="flex items-center gap-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.fill }}
        />
        <span className="text-sm font-semibold text-text-primary">
          {entry.name}: {entry.value}
        </span>
      </div>
    </div>
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
      <div className="py-8 text-center">
        <p className="text-sm text-text-secondary">
          No RAG status data available.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="relative w-full" style={{ height: 220 }}>
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
      </div>

      {/* Legend below chart */}
      <div className="flex justify-center gap-6 mt-2">
        {SEGMENT_CONFIG.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-text-secondary">
              {label}
            </span>
            <span className="text-sm font-bold text-text-primary">
              {data[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
