import { useState, useCallback } from 'react'
import { Clock, Mail, Save, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useScheduleReport } from '@/hooks/useExecReportPDF'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, '0')}:00`,
}))

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ReportSchedulerProps {
  projectId: string
  onSaved?: () => void
}

export function ReportScheduler({ projectId, onSaved }: ReportSchedulerProps) {
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [hour, setHour] = useState('9')
  const [recipients, setRecipients] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')

  const scheduleReport = useScheduleReport(projectId)

  const addRecipient = useCallback(() => {
    const email = emailInput.trim().toLowerCase()
    if (email && email.includes('@') && !recipients.includes(email)) {
      setRecipients((prev) => [...prev, email])
      setEmailInput('')
    }
  }, [emailInput, recipients])

  const removeRecipient = useCallback((email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRecipient()
    }
  }

  const handleSave = () => {
    // Build cron expression: minute hour * * day_of_week
    const cronExpression = `0 ${hour} * * ${dayOfWeek}`
    scheduleReport.mutate(
      { cron_expression: cronExpression, recipients },
      { onSuccess: () => onSaved?.() },
    )
  }

  return (
    <div className="space-y-6 p-4 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary-500" />
        <h3 className="text-sm font-semibold text-text-primary">
          Schedule Recurring Report
        </h3>
      </div>

      {/* Day of week */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide">
          Day of Week
        </label>
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          className="w-full text-sm rounded-md border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {DAYS_OF_WEEK.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time picker */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide">
          Time (UTC)
        </label>
        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="w-full text-sm rounded-md border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {HOURS.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      {/* Recipients */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide">
          <Mail className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
          Recipients
        </label>

        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="user@example.com"
            className="flex-1 text-sm rounded-md border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 px-3 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={addRecipient}
            disabled={!emailInput.trim()}
          >
            Add
          </Button>
        </div>

        {/* Email chips */}
        {recipients.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {recipients.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-xs text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeRecipient(email)}
                  className="ml-0.5 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${email}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Save className="h-4 w-4" />}
        loading={scheduleReport.isPending}
        onClick={handleSave}
        className="w-full"
      >
        Save Schedule
      </Button>

      {scheduleReport.isSuccess && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Schedule saved successfully.
        </p>
      )}

      {scheduleReport.isError && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Failed to save schedule. Please try again.
        </p>
      )}
    </div>
  )
}
