import { useState, useMemo, useCallback } from 'react'
import { BarChart3, Table2, Download, FileText } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
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
import type { ReportType, ReportResult, ReportDataPoint } from '@/hooks/useReports'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportViewerProps {
  reportType: ReportType
  data: ReportResult | null | undefined
}

type ViewMode = 'chart' | 'table'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHART_COLORS = ['#009688', '#8E9AAF', '#00796B', '#D84040', '#7E57C2', '#00838F', '#6B6B6B']

function getDataColumns(dataPoints: ReportDataPoint[]): string[] {
  if (dataPoints.length === 0) return []
  const first = dataPoints[0]
  return Object.keys(first).filter((k) => k !== 'label')
}

function downloadCsv(data: ReportDataPoint[], filename: string) {
  if (data.length === 0) return
  const columns = Object.keys(data[0])
  const header = columns.join(',')
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col]
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`
      return String(val ?? '')
    }).join(','),
  )
  const csvContent = [header, ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Chart renderers per report type
// ---------------------------------------------------------------------------

function renderVelocityChart(data: ReportDataPoint[]) {
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

function renderBurndownChart(data: ReportDataPoint[]) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="value" name="Remaining" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} />
        {data[0] && 'ideal' in data[0] && (
          <Line type="monotone" dataKey="ideal" name="Ideal" stroke={CHART_COLORS[0]} strokeWidth={1} strokeDasharray="5 5" dot={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

function renderBurnupChart(data: ReportDataPoint[]) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="value" name="Completed" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
        {data[0] && 'total' in data[0] && (
          <Line type="monotone" dataKey="total" name="Total Scope" stroke={CHART_COLORS[4]} strokeWidth={2} dot={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

function renderCumulativeFlowChart(data: ReportDataPoint[], series?: { name: string; data: ReportDataPoint[] }[]) {
  // If multi-series data is provided, flatten to stacked area
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

function renderGenericBarChart(data: ReportDataPoint[]) {
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
          <Bar key={col} dataKey={col} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportViewer({ reportType, data }: ReportViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chart')

  const handleExportCsv = useCallback(() => {
    if (!data) return
    downloadCsv(data.data, `report-${reportType}-${Date.now()}`)
  }, [data, reportType])

  const handleExportPdf = useCallback(() => {
    // PDF export is a placeholder — in a real app this would use a library like jsPDF
    window.print()
  }, [])

  const tableColumns = useMemo(() => {
    if (!data || data.data.length === 0) return []
    return Object.keys(data.data[0])
  }, [data])

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-base text-text-secondary">
          No report data to display. Run a report to see results.
        </p>
      </div>
    )
  }

  const chartRenderer = () => {
    switch (reportType) {
      case 'velocity':
        return renderVelocityChart(data.data)
      case 'burndown':
        return renderBurndownChart(data.data)
      case 'burnup':
        return renderBurnupChart(data.data)
      case 'cumulative_flow':
        return renderCumulativeFlowChart(data.data, data.series)
      case 'cycle_time':
      case 'throughput':
      case 'workload':
      case 'custom':
      default:
        return renderGenericBarChart(data.data)
    }
  }

  return (
    <div className="w-full">
      {/* Header: title + toggles + export */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          {data.title}
        </h3>

        <div className="flex items-center gap-2">
          {/* Segmented view mode toggle */}
          <div className="inline-flex border border-surface-200 rounded-[--radius-sm] overflow-hidden">
            <button
              type="button"
              className={cn(
                'px-3 py-1.5 text-sm flex items-center transition-colors',
                viewMode === 'chart'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-text-secondary hover:bg-surface-50',
              )}
              onClick={() => setViewMode('chart')}
              aria-label="Chart view"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                'px-3 py-1.5 text-sm flex items-center transition-colors',
                viewMode === 'table'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-text-secondary hover:bg-surface-50',
              )}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <Table2 className="h-4 w-4" />
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportCsv}
          >
            CSV
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<FileText className="h-4 w-4" />}
            onClick={handleExportPdf}
          >
            PDF
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      {data.summary && Object.keys(data.summary).length > 0 && (
        <div className="flex gap-6 mb-4 flex-wrap">
          {Object.entries(data.summary).map(([key, value]) => (
            <div key={key}>
              <span className="text-xs text-text-secondary capitalize block">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-lg font-bold text-text-primary">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chart or Table */}
      {viewMode === 'chart' ? (
        <div className="p-4 border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
          {chartRenderer()}
        </div>
      ) : (
        <div className="border border-surface-200 rounded-[--radius-md] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50">
              <tr>
                {tableColumns.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-semibold capitalize text-text-primary">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row, index) => (
                <tr key={index} className="hover:bg-surface-50 transition-colors">
                  {tableColumns.map((col) => (
                    <td key={col} className="px-3 py-2 border-t border-surface-200 text-text-primary">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
