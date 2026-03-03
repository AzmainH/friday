import { useState, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import BarChartIcon from '@mui/icons-material/BarChart'
import TableChartIcon from '@mui/icons-material/TableChart'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
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

const CHART_COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548']

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

  const handleViewModeChange = useCallback((_: React.MouseEvent<HTMLElement>, mode: ViewMode | null) => {
    if (mode) setViewMode(mode)
  }, [])

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          No report data to display. Run a report to see results.
        </Typography>
      </Box>
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
    <Box sx={{ width: '100%' }}>
      {/* Header: title + toggles + export */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {data.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="chart" aria-label="Chart view">
              <BarChartIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <TableChartIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCsv}
          >
            CSV
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPdf}
          >
            PDF
          </Button>
        </Box>
      </Box>

      {/* Summary stats */}
      {data.summary && Object.keys(data.summary).length > 0 && (
        <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
          {Object.entries(data.summary).map(([key, value]) => (
            <Box key={key}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {key.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {String(value)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Chart or Table */}
      {viewMode === 'chart' ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          {chartRenderer()}
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {tableColumns.map((col) => (
                  <TableCell key={col} sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {col.replace(/_/g, ' ')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.map((row, index) => (
                <TableRow key={index} hover>
                  {tableColumns.map((col) => (
                    <TableCell key={col}>{String(row[col] ?? '')}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
