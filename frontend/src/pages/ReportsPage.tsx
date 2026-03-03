import { useState, useCallback } from 'react'
import { Play, Trash2, Save, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { formatDateTime } from '@/utils/formatters'
import ReportViewer from '@/components/reports/ReportViewer'
import {
  useSavedReports,
  useRunReport,
  useCreateReport,
  useDeleteReport,
  type ReportType,
  type ReportConfig,
  type SavedReport,
} from '@/hooks/useReports'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'velocity', label: 'Velocity' },
  { value: 'burndown', label: 'Burndown' },
  { value: 'burnup', label: 'Burn-Up' },
  { value: 'cumulative_flow', label: 'Cumulative Flow' },
  { value: 'cycle_time', label: 'Cycle Time' },
  { value: 'throughput', label: 'Throughput' },
  { value: 'workload', label: 'Workload' },
  { value: 'custom', label: 'Custom' },
]

const GROUP_BY_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
  { value: 'issue_type', label: 'Issue Type' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'label', label: 'Label' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  // Saved reports list
  const { data: savedReports, isLoading: reportsLoading, error: reportsError } = useSavedReports()
  const deleteReport = useDeleteReport()
  const createReport = useCreateReport()

  // Report runner state
  const [selectedType, setSelectedType] = useState<ReportType | ''>('')
  const [config, setConfig] = useState<ReportConfig>({})
  const [runConfig, setRunConfig] = useState<{ type: ReportType; config: ReportConfig } | null>(null)

  // Run report query — only fires when runConfig is set
  const {
    data: reportResult,
    isLoading: reportRunning,
    error: reportError,
  } = useRunReport(
    runConfig?.type,
    runConfig?.config,
  )

  // Save report dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')

  // Selected saved report (to view details)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)

  // ---------- Handlers ----------

  const handleRunReport = useCallback(() => {
    if (!selectedType) return
    setRunConfig({ type: selectedType as ReportType, config })
    setSelectedSavedId(null)
  }, [selectedType, config])

  const handleRunSavedReport = useCallback((report: SavedReport) => {
    setSelectedType(report.report_type)
    setConfig(report.config_json)
    setRunConfig({ type: report.report_type, config: report.config_json })
    setSelectedSavedId(report.id)
  }, [])

  const handleDeleteReport = useCallback(
    (id: string) => {
      deleteReport.mutate(id)
      if (selectedSavedId === id) {
        setSelectedSavedId(null)
      }
    },
    [deleteReport, selectedSavedId],
  )

  const handleSaveReport = useCallback(() => {
    if (!selectedType || !saveName.trim()) return
    createReport.mutate(
      {
        name: saveName.trim(),
        report_type: selectedType as ReportType,
        config_json: config,
      },
      {
        onSuccess: () => {
          setSaveDialogOpen(false)
          setSaveName('')
        },
      },
    )
  }, [selectedType, saveName, config, createReport])

  const handleConfigChange = useCallback(
    (field: keyof ReportConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setConfig((prev) => ({ ...prev, [field]: e.target.value }))
    },
    [],
  )

  // ---------- Render ----------

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Reports
      </h1>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Left sidebar: saved reports */}
        <div className="w-full md:w-[280px] shrink-0 border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-surface-200">
            <span className="text-sm font-semibold text-text-primary">
              Saved Reports
            </span>
          </div>

          {reportsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-12 rounded-[--radius-sm]" />
              ))}
            </div>
          ) : reportsError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[--radius-sm] text-sm m-2">
              Failed to load reports
            </div>
          ) : savedReports && savedReports.length > 0 ? (
            <div>
              {savedReports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => handleRunSavedReport(report)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 cursor-pointer hover:bg-surface-50 transition-colors text-left',
                    selectedSavedId === report.id && 'bg-primary-50 border-l-2 border-primary-500',
                  )}
                >
                  <BarChart3 className="h-4 w-4 text-text-tertiary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {report.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="px-1.5 py-0.5 text-[0.65rem] font-medium rounded-full border border-surface-200 text-text-secondary capitalize">
                        {report.report_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {formatDateTime(report.updated_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded text-text-tertiary hover:text-error transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteReport(report.id)
                    }}
                    aria-label={`Delete report ${report.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-text-secondary">
                No saved reports yet.
              </p>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Config form */}
          <div className="p-5 border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface mb-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">
              Run New Report
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Report type */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Report Type
                </label>
                <select
                  className="w-full text-sm border border-surface-200 rounded-[--radius-sm] px-3 py-2 bg-white dark:bg-dark-surface outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ReportType | '')}
                >
                  <option value="">Select a type...</option>
                  {REPORT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group by */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Group By
                </label>
                <select
                  className="w-full text-sm border border-surface-200 rounded-[--radius-sm] px-3 py-2 bg-white dark:bg-dark-surface outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  value={config.group_by ?? ''}
                  onChange={handleConfigChange('group_by')}
                >
                  <option value="">None</option>
                  {GROUP_BY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date from */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  className="w-full text-sm border border-surface-200 rounded-[--radius-sm] px-3 py-2 bg-white dark:bg-dark-surface outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  value={config.date_from ?? ''}
                  onChange={handleConfigChange('date_from')}
                />
              </div>

              {/* Date to */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  className="w-full text-sm border border-surface-200 rounded-[--radius-sm] px-3 py-2 bg-white dark:bg-dark-surface outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  value={config.date_to ?? ''}
                  onChange={handleConfigChange('date_to')}
                />
              </div>

              {/* Project ID */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  className="w-full text-sm border border-surface-200 rounded-[--radius-sm] px-3 py-2 bg-white dark:bg-dark-surface outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Optional"
                  value={config.project_id ?? ''}
                  onChange={handleConfigChange('project_id')}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                leftIcon={<Play className="h-4 w-4" />}
                onClick={handleRunReport}
                disabled={!selectedType || reportRunning}
              >
                {reportRunning ? 'Running...' : 'Run Report'}
              </Button>

              {reportResult && (
                <Button
                  variant="ghost"
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={() => {
                    setSaveName('')
                    setSaveDialogOpen(true)
                  }}
                >
                  Save Report
                </Button>
              )}
            </div>
          </div>

          <hr className="border-surface-200 mb-6" />

          {/* Report results */}
          {reportError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[--radius-sm] text-sm mb-4">
              Failed to run report. Please check your configuration and try again.
            </div>
          )}

          {reportRunning ? (
            <div className="skeleton-shimmer h-[360px] rounded-[--radius-md]" />
          ) : reportResult ? (
            <ReportViewer
              reportType={runConfig?.type ?? 'custom'}
              data={reportResult}
            />
          ) : (
            <div className="py-16 text-center border border-dashed border-surface-300 rounded-[--radius-md]">
              <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-2" />
              <p className="text-base text-text-secondary">
                Select a report type and click &quot;Run Report&quot; to see results.
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                Or select a saved report from the sidebar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save report dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        title="Save Report"
        size="sm"
      >
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Report Name
          </label>
          <input
            autoFocus
            type="text"
            className="w-full text-sm border border-surface-200 rounded-[--radius-sm] px-3 py-2 bg-white dark:bg-dark-surface outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="e.g., Sprint Velocity Q1"
          />
          {selectedType && (
            <div className="mt-3">
              <span className="px-1.5 py-0.5 text-[0.65rem] font-medium rounded-full border border-surface-200 text-text-secondary capitalize">
                {selectedType.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveReport}
            disabled={!saveName.trim() || createReport.isPending}
          >
            {createReport.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
