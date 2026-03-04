import { Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import type { ReportType, ReportConfig } from '@/hooks/useReports'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportFiltersProps {
  selectedType: ReportType | undefined
  onTypeChange: (type: ReportType) => void
  config: ReportConfig
  onConfigChange: (config: ReportConfig) => void
  onRun: () => void
  isRunning?: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TYPE_OPTIONS = [
  { value: 'velocity', label: 'Velocity' },
  { value: 'burndown', label: 'Burndown' },
  { value: 'burnup', label: 'Burn Up' },
  { value: 'cumulative_flow', label: 'Cumulative Flow' },
  { value: 'cycle_time', label: 'Cycle Time' },
  { value: 'throughput', label: 'Throughput' },
  { value: 'workload', label: 'Workload' },
  { value: 'custom', label: 'Custom' },
]

const GROUP_BY_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'month', label: 'Month' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportFilters({
  selectedType,
  onTypeChange,
  config,
  onConfigChange,
  onRun,
  isRunning = false,
}: ReportFiltersProps) {
  const inputClass =
    'w-full rounded-[--radius-sm] border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-surface-100 dark:border-surface-200 dark:text-text-primary'

  return (
    <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Report type */}
        <Select
          label="Report Type"
          value={selectedType ?? null}
          onChange={(val) => onTypeChange(val as ReportType)}
          options={REPORT_TYPE_OPTIONS}
          placeholder="Select type..."
        />

        {/* Date from */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">From</label>
          <input
            type="date"
            className={inputClass}
            value={config.date_from ?? ''}
            onChange={(e) => onConfigChange({ ...config, date_from: e.target.value || undefined })}
          />
        </div>

        {/* Date to */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">To</label>
          <input
            type="date"
            className={inputClass}
            value={config.date_to ?? ''}
            onChange={(e) => onConfigChange({ ...config, date_to: e.target.value || undefined })}
          />
        </div>

        {/* Group by */}
        <Select
          label="Group By"
          value={config.group_by ?? null}
          onChange={(val) => onConfigChange({ ...config, group_by: val || undefined })}
          options={GROUP_BY_OPTIONS}
          placeholder="None"
        />

        {/* Run button */}
        <div>
          <Button
            onClick={onRun}
            disabled={!selectedType || isRunning}
            loading={isRunning}
            leftIcon={<Play className="h-4 w-4" />}
            className="w-full"
          >
            Run Report
          </Button>
        </div>
      </div>
    </div>
  )
}
