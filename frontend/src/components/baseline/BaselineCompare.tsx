import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import RemoveIcon from '@mui/icons-material/Remove'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { formatDate } from '@/utils/formatters'

// ---- Types ----

interface BaselineEntry {
  issue_id: string
  issue_key: string
  issue_summary: string
  baseline_start: string | null
  baseline_end: string | null
  current_start: string | null
  current_end: string | null
}

interface BaselineComparisonData {
  baseline_id: string
  baseline_name: string
  created_at: string
  entries: BaselineEntry[]
}

// ---- Props ----

interface BaselineCompareProps {
  baselineId: string
}

// ---- Helpers ----

/** Calculate variance in days between two date strings. Positive = slipped. */
function calcVarianceDays(
  baseline: string | null,
  current: string | null,
): number | null {
  if (!baseline || !current) return null
  const baselineMs = new Date(baseline).getTime()
  const currentMs = new Date(current).getTime()
  return Math.round((currentMs - baselineMs) / (1000 * 60 * 60 * 24))
}

// ---- Component ----

export default function BaselineCompare({ baselineId }: BaselineCompareProps) {
  const { data, isLoading, isError } = useQuery<BaselineComparisonData>({
    queryKey: ['baseline-compare', baselineId],
    queryFn: async () => {
      const { data } = await client.get(`/baselines/${baselineId}/compare`)
      return data
    },
    enabled: !!baselineId,
  })

  // Compute variance for each entry
  const rows = useMemo(() => {
    if (!data) return []
    return data.entries.map((entry) => {
      const startVariance = calcVarianceDays(entry.baseline_start, entry.current_start)
      const endVariance = calcVarianceDays(entry.baseline_end, entry.current_end)
      return { ...entry, startVariance, endVariance }
    })
  }, [data])

  // Summary stats
  const summary = useMemo(() => {
    const slipped = rows.filter(
      (r) => (r.startVariance !== null && r.startVariance > 0) ||
             (r.endVariance !== null && r.endVariance > 0),
    ).length
    const onTrack = rows.filter(
      (r) =>
        (r.startVariance === null || r.startVariance <= 0) &&
        (r.endVariance === null || r.endVariance <= 0),
    ).length
    const noData = rows.filter(
      (r) => r.startVariance === null && r.endVariance === null,
    ).length
    return { slipped, onTrack, noData, total: rows.length }
  }, [rows])

  if (isError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load baseline comparison. Please try again.
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    )
  }

  if (!data || data.entries.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No baseline data available for comparison.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header with baseline info */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Baseline: {data.baseline_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Created {formatDate(data.created_at)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`${summary.slipped} slipped`}
            size="small"
            sx={{
              bgcolor: summary.slipped > 0 ? '#f4433620' : 'grey.100',
              color: summary.slipped > 0 ? '#f44336' : 'text.secondary',
              fontWeight: 600,
            }}
          />
          <Chip
            label={`${summary.onTrack} on track`}
            size="small"
            sx={{
              bgcolor: '#4caf5020',
              color: '#4caf50',
              fontWeight: 600,
            }}
          />
          <Chip
            label={`${summary.total} total`}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Comparison table */}
      <Paper
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'auto',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Issue</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Baseline Start</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Current Start</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Start Variance
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Baseline End</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Current End</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                End Variance
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.issue_id} hover>
                {/* Issue key + summary */}
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {row.issue_key}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.issue_summary}
                  </Typography>
                </TableCell>

                {/* Baseline start */}
                <TableCell>
                  <Typography variant="body2">{formatDate(row.baseline_start)}</Typography>
                </TableCell>

                {/* Current start */}
                <TableCell>
                  <Typography variant="body2">{formatDate(row.current_start)}</Typography>
                </TableCell>

                {/* Start variance */}
                <TableCell align="center">
                  <VarianceBadge days={row.startVariance} />
                </TableCell>

                {/* Baseline end */}
                <TableCell>
                  <Typography variant="body2">{formatDate(row.baseline_end)}</Typography>
                </TableCell>

                {/* Current end */}
                <TableCell>
                  <Typography variant="body2">{formatDate(row.current_end)}</Typography>
                </TableCell>

                {/* End variance */}
                <TableCell align="center">
                  <VarianceBadge days={row.endVariance} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

// ---- Variance badge sub-component ----

function VarianceBadge({ days }: { days: number | null }) {
  if (days === null) {
    return (
      <Typography variant="caption" color="text.disabled">
        --
      </Typography>
    )
  }

  if (days === 0) {
    return (
      <Chip
        icon={<RemoveIcon sx={{ fontSize: 14 }} />}
        label="On time"
        size="small"
        sx={{
          bgcolor: '#4caf5015',
          color: '#4caf50',
          fontWeight: 600,
          fontSize: '0.7rem',
          height: 22,
        }}
      />
    )
  }

  const isSlipped = days > 0
  const color = isSlipped ? '#f44336' : '#4caf50'
  const icon = isSlipped ? (
    <ArrowDownwardIcon sx={{ fontSize: 14 }} />
  ) : (
    <ArrowUpwardIcon sx={{ fontSize: 14 }} />
  )
  const label = isSlipped ? `+${days}d late` : `${Math.abs(days)}d early`

  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        bgcolor: `${color}15`,
        color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
      }}
    />
  )
}
