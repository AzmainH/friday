import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { useAutomationLogs } from '@/hooks/useAutomations'
import { formatDateTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecutionLogProps {
  ruleId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExecutionLog({ ruleId }: ExecutionLogProps) {
  const { data: logs, isLoading } = useAutomationLogs(ruleId)

  if (isLoading) {
    return (
      <Box sx={{ py: 2 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 0.5, borderRadius: 1 }} />
        ))}
      </Box>
    )
  }

  const entries = logs ?? []

  if (entries.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No executions recorded yet.
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>Issue</TableCell>
            <TableCell>Trigger</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Error</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} hover>
              <TableCell>
                <Typography variant="body2" noWrap>
                  {formatDateTime(entry.executed_at)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {entry.issue_key}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {entry.trigger_type.replace(/_/g, ' ')}
                </Typography>
              </TableCell>
              <TableCell>
                {entry.success ? (
                  <Chip
                    icon={<CheckCircleOutlineIcon />}
                    label="Success"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Chip
                    icon={<ErrorOutlineIcon />}
                    label="Failed"
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  color="error"
                  sx={{
                    maxWidth: 260,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.error_message ?? '—'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
