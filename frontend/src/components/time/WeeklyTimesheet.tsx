import { useState, useMemo, useCallback } from 'react'
import { useWeeklyTimesheet, useLogTime } from '@/hooks/useTimeTracking'
import { formatHours } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Produce an array of 7 ISO date strings starting from weekStart (a Monday). */
function weekDates(weekStart: string): string[] {
  const start = new Date(weekStart)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeeklyTimesheetProps {
  userId: string
  weekStart: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WeeklyTimesheet({ userId, weekStart }: WeeklyTimesheetProps) {
  const { data: timesheet, isLoading, error } = useWeeklyTimesheet(userId, weekStart)
  const logTime = useLogTime()

  const dates = useMemo(() => weekDates(weekStart), [weekStart])

  // Local edits keyed by `${issueId}:${date}`
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({})

  const cellKey = useCallback(
    (issueId: string, date: string) => `${issueId}:${date}`,
    [],
  )

  const handleChange = useCallback(
    (issueId: string, date: string, value: string) => {
      setLocalEdits((prev) => ({
        ...prev,
        [cellKey(issueId, date)]: value,
      }))
    },
    [cellKey],
  )

  const handleBlur = useCallback(
    async (issueId: string, date: string) => {
      const key = cellKey(issueId, date)
      const rawValue = localEdits[key]
      if (rawValue === undefined) return

      const hours = parseFloat(rawValue)
      if (isNaN(hours) || hours < 0) {
        // Revert invalid input
        setLocalEdits((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        return
      }

      try {
        await logTime.mutateAsync({ issue_id: issueId, hours, date })
      } finally {
        setLocalEdits((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }
    },
    [localEdits, cellKey, logTime],
  )

  // Compute column (daily) totals and grand total from timesheet data + local edits
  const { rowTotals, dailyTotals, grandTotal } = useMemo(() => {
    const _rowTotals: Record<string, number> = {}
    const _dailyTotals: Record<string, number> = {}
    let _grandTotal = 0

    for (const date of dates) {
      _dailyTotals[date] = 0
    }

    if (timesheet) {
      for (const row of timesheet.rows) {
        let rowSum = 0
        for (const date of dates) {
          const key = `${row.issue_id}:${date}`
          const localVal = localEdits[key]
          const hours =
            localVal !== undefined
              ? (parseFloat(localVal) || 0)
              : (row.entries[date] ?? 0)
          rowSum += hours
          _dailyTotals[date] += hours
        }
        _rowTotals[row.issue_id] = rowSum
        _grandTotal += rowSum
      }
    }

    return { rowTotals: _rowTotals, dailyTotals: _dailyTotals, grandTotal: _grandTotal }
  }, [timesheet, dates, localEdits])

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500 mx-auto" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
        Failed to load timesheet.
      </div>
    )
  }

  const rows = timesheet?.rows ?? []

  return (
    <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary min-w-[200px]">Issue</th>
            {dates.map((date, i) => (
              <th key={date} className="px-2 py-2 text-center text-xs font-semibold text-text-secondary min-w-[72px]">
                <span className="block">{DAY_LABELS[i]}</span>
                <span className="block text-text-secondary font-normal">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </th>
            ))}
            <th className="px-2 py-2 text-center text-xs font-semibold text-text-secondary min-w-[72px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center border-t border-surface-200">
                <p className="text-sm text-text-secondary">
                  No time entries for this week.
                </p>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.issue_id} className="hover:bg-surface-50 transition-colors">
                <td className="px-4 py-2 border-t border-surface-200">
                  <p className="text-sm font-medium text-text-primary">{row.issue_key}</p>
                  <p className="text-xs text-text-secondary truncate">{row.issue_summary}</p>
                </td>
                {dates.map((date) => {
                  const key = cellKey(row.issue_id, date)
                  const localVal = localEdits[key]
                  const serverVal = row.entries[date] ?? 0
                  const displayVal = localVal !== undefined ? localVal : (serverVal > 0 ? String(serverVal) : '')

                  return (
                    <td key={date} className="px-1 py-1 border-t border-surface-200 text-center">
                      <input
                        type="number"
                        value={displayVal}
                        onChange={(e) => handleChange(row.issue_id, date, e.target.value)}
                        onBlur={() => handleBlur(row.issue_id, date)}
                        min={0}
                        max={24}
                        step={0.25}
                        className="w-12 text-center text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-500 rounded py-1"
                      />
                    </td>
                  )
                })}
                <td className="px-2 py-2 border-t border-surface-200 text-center">
                  <span className="text-sm font-semibold text-text-primary">
                    {formatHours(rowTotals[row.issue_id] ?? 0)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-surface-50">
              <td className="px-4 py-2 text-sm font-semibold text-text-primary border-t border-surface-200">Daily Total</td>
              {dates.map((date) => (
                <td key={date} className="px-2 py-2 text-center text-sm font-semibold text-text-primary border-t border-surface-200">
                  {formatHours(dailyTotals[date] ?? 0)}
                </td>
              ))}
              <td className="px-2 py-2 text-center text-sm font-bold text-primary-500 border-t border-surface-200">
                {formatHours(grandTotal)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
