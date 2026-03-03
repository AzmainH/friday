import { useState, useMemo, useCallback } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import LinearProgress from '@mui/material/LinearProgress'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Time Tracking
      </Typography>

      {/* Week selector */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <IconButton onClick={handlePrev} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ minWidth: 220, textAlign: 'center', cursor: 'pointer' }}
          onClick={handleToday}
        >
          {formatWeekRange(weekStart)}
        </Typography>
        <IconButton onClick={handleNext} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {/* Summary bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={4} alignItems="center">
          <Box sx={{ flex: '0 0 auto' }}>
            <Typography variant="caption" color="text.secondary">
              Total Hours
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatHours(totalHours)}
            </Typography>
          </Box>
          <Box sx={{ flex: '0 0 auto' }}>
            <Typography variant="caption" color="text.secondary">
              Capacity
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatHours(WEEKLY_CAPACITY_HOURS)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Utilization
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {formatPercent(utilization)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(utilization, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor:
                    utilization > 100
                      ? 'error.main'
                      : utilization >= 80
                        ? 'warning.main'
                        : 'success.main',
                },
              }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Timesheet grid */}
      <WeeklyTimesheet userId={userId} weekStart={weekStart} />
    </Container>
  )
}
