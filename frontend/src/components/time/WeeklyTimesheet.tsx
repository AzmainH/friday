import { useState, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableFooter from '@mui/material/TableFooter'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load timesheet.
      </Alert>
    )
  }

  const rows = timesheet?.rows ?? []

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Issue</TableCell>
            {dates.map((date, i) => (
              <TableCell key={date} align="center" sx={{ fontWeight: 600, minWidth: 72 }}>
                <Typography variant="caption" display="block">
                  {DAY_LABELS[i]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 600, minWidth: 72 }}>
              Total
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  No time entries for this week.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.issue_id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {row.issue_key}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {row.issue_summary}
                  </Typography>
                </TableCell>
                {dates.map((date) => {
                  const key = cellKey(row.issue_id, date)
                  const localVal = localEdits[key]
                  const serverVal = row.entries[date] ?? 0
                  const displayVal = localVal !== undefined ? localVal : (serverVal > 0 ? String(serverVal) : '')

                  return (
                    <TableCell key={date} align="center" sx={{ p: 0.5 }}>
                      <TextField
                        value={displayVal}
                        onChange={(e) => handleChange(row.issue_id, date, e.target.value)}
                        onBlur={() => handleBlur(row.issue_id, date)}
                        size="small"
                        type="number"
                        inputProps={{
                          min: 0,
                          max: 24,
                          step: 0.25,
                          style: { textAlign: 'center', padding: '4px 2px', width: 48 },
                        }}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'transparent' },
                            '&:hover fieldset': { borderColor: 'divider' },
                            '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                          },
                        }}
                      />
                    </TableCell>
                  )
                })}
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {formatHours(rowTotals[row.issue_id] ?? 0)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Daily Total</TableCell>
              {dates.map((date) => (
                <TableCell key={date} align="center" sx={{ fontWeight: 600 }}>
                  {formatHours(dailyTotals[date] ?? 0)}
                </TableCell>
              ))}
              <TableCell
                align="center"
                sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}
              >
                {formatHours(grandTotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  )
}
