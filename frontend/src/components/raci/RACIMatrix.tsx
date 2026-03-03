import { useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import { useRACIMatrix, useUpdateRACICell, type RACIRole } from '@/hooks/useRACIMatrix'

// ---- RACI role config ----

const RACI_CYCLE: RACIRole[] = ['R', 'A', 'C', 'I', null]

const RACI_COLORS: Record<string, string> = {
  R: '#2196f3', // Responsible - blue
  A: '#f44336', // Accountable - red
  C: '#ff9800', // Consulted - yellow/amber
  I: '#4caf50', // Informed - green
}

const RACI_LABELS: Record<string, string> = {
  R: 'Responsible',
  A: 'Accountable',
  C: 'Consulted',
  I: 'Informed',
}

function getNextRole(current: RACIRole): RACIRole {
  const idx = RACI_CYCLE.indexOf(current)
  return RACI_CYCLE[(idx + 1) % RACI_CYCLE.length]
}

// ---- Props ----

interface RACIMatrixProps {
  projectId: string
}

// ---- Component ----

export default function RACIMatrix({ projectId }: RACIMatrixProps) {
  const { data, isLoading, isError } = useRACIMatrix(projectId)
  const updateCell = useUpdateRACICell(projectId)

  // Validation: check each row has exactly one 'A'
  const warnings = useMemo(() => {
    if (!data) return []
    const result: string[] = []
    for (const row of data.rows) {
      const accountableCount = Object.values(row.assignments).filter(
        (role) => role === 'A',
      ).length
      if (accountableCount === 0) {
        result.push(`"${row.issue_key}" has no Accountable (A) assignment.`)
      } else if (accountableCount > 1) {
        result.push(
          `"${row.issue_key}" has ${accountableCount} Accountable (A) assignments. Only one is recommended.`,
        )
      }
    }
    return result
  }, [data])

  const handleCellClick = useCallback(
    (issueId: string, userId: string, currentRole: RACIRole) => {
      const nextRole = getNextRole(currentRole)
      updateCell.mutate({ issue_id: issueId, user_id: userId, role: nextRole })
    },
    [updateCell],
  )

  if (isError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load RACI matrix. Please try again.
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

  if (!data || data.rows.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No activities or issues found to build a RACI matrix.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(RACI_COLORS).map(([role, color]) => (
          <Box key={role} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1,
                bgcolor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>
                {role}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {RACI_LABELS[role]}
            </Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: 1,
              bgcolor: 'grey.200',
              border: '1px dashed',
              borderColor: 'grey.400',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Unassigned (click to set)
          </Typography>
        </Box>
      </Box>

      {/* Validation warnings */}
      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Validation warnings:
          </Typography>
          {warnings.map((w, i) => (
            <Typography key={i} variant="body2">
              {w}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Matrix grid */}
      <Paper
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'auto',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  minWidth: 180,
                  position: 'sticky',
                  left: 0,
                  bgcolor: 'background.paper',
                  zIndex: 3,
                }}
              >
                Activity / Issue
              </TableCell>
              {data.members.map((member) => (
                <TableCell
                  key={member.user_id}
                  align="center"
                  sx={{ fontWeight: 600, minWidth: 80 }}
                >
                  <Tooltip title={member.display_name} arrow>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Avatar
                        src={member.avatar_url ?? undefined}
                        sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                      >
                        {member.display_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography
                        variant="caption"
                        sx={{
                          maxWidth: 80,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.display_name.split(' ')[0]}
                      </Typography>
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow key={row.issue_id} hover>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    borderRight: '1px solid',
                    borderRightColor: 'divider',
                  }}
                >
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
                {data.members.map((member) => {
                  const role = row.assignments[member.user_id] ?? null
                  const color = role ? RACI_COLORS[role] : undefined

                  return (
                    <TableCell
                      key={member.user_id}
                      align="center"
                      sx={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.15s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() =>
                        handleCellClick(row.issue_id, member.user_id, role)
                      }
                    >
                      {role ? (
                        <Tooltip
                          title={`${RACI_LABELS[role]} - Click to change`}
                          arrow
                        >
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: color,
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              transition: 'transform 0.1s',
                              '&:hover': { transform: 'scale(1.15)' },
                            }}
                          >
                            {role}
                          </Box>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Click to assign" arrow>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: 'grey.100',
                              border: '1px dashed',
                              borderColor: 'grey.300',
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'primary.50',
                              },
                            }}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
