import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Save, FileBarChart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import ReportTypeCard from '@/components/reports/ReportTypeCard'
import ReportFilters from '@/components/reports/ReportFilters'
import ReportChart from '@/components/reports/ReportChart'
import SavedReportsList from '@/components/reports/SavedReportsList'
import {
  useSavedReports,
  useRunReport,
  useCreateReport,
  useDeleteReport,
} from '@/hooks/useReports'
import type { ReportType, ReportConfig } from '@/hooks/useReports'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_REPORT_TYPES: ReportType[] = [
  'velocity',
  'burndown',
  'burnup',
  'cumulative_flow',
  'cycle_time',
  'throughput',
  'workload',
]

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ProjectReportsPage() {
  const { projectId } = useParams<{ projectId: string }>()

  // --- State ---
  const [selectedType, setSelectedType] = useState<ReportType | undefined>()
  const [config, setConfig] = useState<ReportConfig>({})
  const [runTrigger, setRunTrigger] = useState<{ type: ReportType; config: ReportConfig } | null>(
    null,
  )
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')

  // --- Queries & Mutations ---
  const { data: savedReports = [], isLoading: savedLoading } = useSavedReports()
  const {
    data: reportResult,
    isLoading: isRunning,
    isFetching: isRefetching,
  } = useRunReport(
    runTrigger?.type,
    runTrigger ? { ...runTrigger.config, project_id: projectId } : undefined,
  )
  const createReport = useCreateReport()
  const deleteReport = useDeleteReport()

  // --- Handlers ---
  const handleSelectType = useCallback((type: ReportType) => {
    setSelectedType(type)
  }, [])

  const handleRun = useCallback(() => {
    if (!selectedType) return
    setRunTrigger({ type: selectedType, config })
  }, [selectedType, config])

  const handleRunSaved = useCallback(
    (type: ReportType, savedConfig: ReportConfig) => {
      setSelectedType(type)
      setConfig(savedConfig)
      setRunTrigger({ type, config: savedConfig })
    },
    [],
  )

  const handleSave = useCallback(async () => {
    if (!runTrigger || !saveName.trim()) return
    await createReport.mutateAsync({
      name: saveName.trim(),
      report_type: runTrigger.type,
      config_json: { ...runTrigger.config, project_id: projectId },
    })
    setSaveDialogOpen(false)
    setSaveName('')
  }, [runTrigger, saveName, projectId, createReport])

  const handleDelete = useCallback(
    (id: string) => {
      deleteReport.mutate(id)
    },
    [deleteReport],
  )

  const isReportRunning = isRunning || isRefetching

  // --- Input styling ---
  const inputClass =
    'w-full rounded-[--radius-sm] border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-surface-100 dark:border-surface-200 dark:text-text-primary'

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Generate and review project analytics
          </p>
        </div>
        {reportResult && (
          <Button
            variant="secondary"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => setSaveDialogOpen(true)}
          >
            Save Report
          </Button>
        )}
      </div>

      {/* Report type cards */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Report Type
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {ALL_REPORT_TYPES.map((type) => (
            <ReportTypeCard
              key={type}
              type={type}
              selected={selectedType === type}
              onClick={handleSelectType}
            />
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="mb-6">
        <ReportFilters
          selectedType={selectedType}
          onTypeChange={handleSelectType}
          config={config}
          onConfigChange={setConfig}
          onRun={handleRun}
          isRunning={isReportRunning}
        />
      </section>

      {/* Chart display area */}
      <section className="mb-8">
        {isReportRunning ? (
          <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-8 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-primary-500" />
            <p className="text-sm text-text-secondary">Running report...</p>
          </div>
        ) : reportResult ? (
          <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4">
            {/* Report title + summary */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-text-primary">{reportResult.title}</h3>
              {reportResult.summary && Object.keys(reportResult.summary).length > 0 && (
                <div className="flex gap-6 mt-2 flex-wrap">
                  {Object.entries(reportResult.summary).map(([key, value]) => (
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
            </div>

            {/* Chart */}
            <ReportChart
              reportType={reportResult.report_type}
              data={reportResult.data}
              series={reportResult.series}
              summary={reportResult.summary}
            />
          </div>
        ) : (
          <EmptyState
            icon={FileBarChart}
            title="No report generated yet"
            description="Select a report type above and click Run Report to generate analytics."
            className="border border-dashed border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface"
          />
        )}
      </section>

      {/* Saved reports */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Saved Reports</h2>
        {savedLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-surface-200 border-t-primary-500" />
          </div>
        ) : (
          <SavedReportsList
            reports={savedReports}
            onRun={handleRunSaved}
            onDelete={handleDelete}
            isDeleting={deleteReport.isPending}
          />
        )}
      </section>

      {/* Save dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        title="Save Report"
        size="sm"
      >
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Report Name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Sprint 12 Velocity"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            autoFocus
          />
        </div>
        <DialogFooter className="mt-6 border-t-0 px-0">
          <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!saveName.trim() || createReport.isPending}
            loading={createReport.isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
