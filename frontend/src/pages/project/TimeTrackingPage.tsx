import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import WeeklyTimesheet from '@/components/time/WeeklyTimesheet'
import { useWeeklyTimesheet } from '@/hooks/useTimeTracking'
import { formatHours, formatPercent } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKLY_CAPACITY_HOURS = 40

/** Get the Monday of the week containing `date`. */
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Sunday = 0, Monday = 1, etc.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function shiftWeek(isoDate: string, delta: number): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + delta * 7)
  return toISODate(d)
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const startStr = start.toLocaleDateString('en-US', opts)
  const endStr = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })
  return `${startStr} - ${endStr}`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// For now, use a placeholder userId; in a real app this would come from auth context.
const CURRENT_USER_ID = 'me'

export default function TimeTrackingPage() {
  const [weekStart, setWeekStart] = useState(() => toISODate(getMonday(new Date())))

  const userId = CURRENT_USER_ID
  const { data: timesheet } = useWeeklyTimesheet(userId, weekStart)

  const totalHours = useMemo(() => timesheet?.grand_total ?? 0, [timesheet])
  const utilization = useMemo(
    () => (WEEKLY_CAPACITY_HOURS > 0 ? (totalHours / WEEKLY_CAPACITY_HOURS) * 100 : 0),
    [totalHours],
  )

  const handlePrev = useCallback(() => {
    setWeekStart((ws) => shiftWeek(ws, -1))
  }, [])

  const handleNext = useCallback(() => {
    setWeekStart((ws) => shiftWeek(ws, 1))
  }, [])

  const handleToday = useCallback(() => {
    setWeekStart(toISODate(getMonday(new Date())))
  }, [])

  const progressColor = utilization > 100
    ? 'bg-red-500'
    : utilization >= 80
      ? 'bg-amber-500'
      : 'bg-green-500'

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-text-primary mb-4">Time Tracking</h1>

      {/* Week selector */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={handlePrev}
          className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span
          className="min-w-[220px] text-center text-sm font-semibold text-text-primary cursor-pointer"
          onClick={handleToday}
        >
          {formatWeekRange(weekStart)}
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Summary bar */}
      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4 mb-6">
        <div className="flex items-center gap-8">
          <div className="flex-shrink-0">
            <p className="text-xs text-text-secondary">Total Hours</p>
            <p className="text-lg font-bold text-text-primary">{formatHours(totalHours)}</p>
          </div>
          <div className="flex-shrink-0">
            <p className="text-xs text-text-secondary">Capacity</p>
            <p className="text-lg font-bold text-text-primary">{formatHours(WEEKLY_CAPACITY_HOURS)}</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-text-secondary">Utilization</p>
              <p className="text-xs font-semibold text-text-primary">{formatPercent(utilization)}</p>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-200">
              <div
                className={cn('h-full rounded-full transition-all', progressColor)}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timesheet grid */}
      <WeeklyTimesheet userId={userId} weekStart={weekStart} />
    </div>
  )
}
