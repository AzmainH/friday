import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ReportType, ReportDataPoint } from '@/hooks/useReports'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportChartProps {
  reportType: ReportType
  data: ReportDataPoint[]
  series?: { name: string; data: ReportDataPoint[] }[]
  summary?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  '#4f46e5', // primary / indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDataColumns(dataPoints: ReportDataPoint[]): string[] {
  if (dataPoints.length === 0) return []
  return Object.keys(dataPoints[0]).filter((k) => k !== 'label')
}

// ---------------------------------------------------------------------------
// Chart renderers
// ---------------------------------------------------------------------------

function VelocityChart({ data }: { data: ReportDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="value" name="Story Points" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function BurndownChart({ data }: { data: ReportDataPoint[] }) {
  const hasIdeal = data.length > 0 && 'ideal' in data[0]
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="value"
          name="Remaining"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={false}
        />
        {hasIdeal && (
          <Line
            type="monotone"
            dataKey="ideal"
            name="Ideal"
            stroke={CHART_COLORS[2]}
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

function BurnupChart({ data }: { data: ReportDataPoint[] }) {
  const hasTotal = data.length > 0 && 'total' in data[0]
  return (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {hasTotal && (
          <Area
            type="monotone"
            dataKey="total"
            name="Total Scope"
            stroke={CHART_COLORS[3]}
            fill="transparent"
            strokeWidth={2}
            dot={false}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          name="Completed"
          stroke={CHART_COLORS[0]}
          fill={`${CHART_COLORS[0]}20`}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function CumulativeFlowChart({
  data,
  series,
}: {
  data: ReportDataPoint[]
  series?: { name: string; data: ReportDataPoint[] }[]
}) {
  const columns = getDataColumns(data)

  return (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series
          ? series.map((s, i) => (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stackId="1"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))
          : columns.map((col, i) => (
              <Area
                key={col}
                type="monotone"
                dataKey={col}
                stackId="1"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function CycleTimeChart({ data }: { data: ReportDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 12 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="value" name="Cycle Time (days)" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ThroughputChart({ data }: { data: ReportDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="value" name="Issues Completed" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function WorkloadChart({ data }: { data: ReportDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(360, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 80, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} tickLine={false} width={80} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="value" name="Issues" fill={CHART_COLORS[4]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function GenericBarChart({ data }: { data: ReportDataPoint[] }) {
  const columns = getDataColumns(data)
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {columns.map((col, i) => (
          <Bar
            key={col}
            dataKey={col}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReportChart({ reportType, data, series }: ReportChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-text-secondary text-sm">
        No data available for this report.
      </div>
    )
  }

  switch (reportType) {
    case 'velocity':
      return <VelocityChart data={data} />
    case 'burndown':
      return <BurndownChart data={data} />
    case 'burnup':
      return <BurnupChart data={data} />
    case 'cumulative_flow':
      return <CumulativeFlowChart data={data} series={series} />
    case 'cycle_time':
      return <CycleTimeChart data={data} />
    case 'throughput':
      return <ThroughputChart data={data} />
    case 'workload':
      return <WorkloadChart data={data} />
    case 'custom':
    default:
      return <GenericBarChart data={data} />
  }
}
