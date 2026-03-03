import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'
import { formatDate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MilestoneItem {
  id: string
  name: string
  due_date: string | null
  status: string
}

export interface MilestoneTimelineWidgetProps {
  milestones: MilestoneItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: string): 'success' | 'warning' | 'error' | 'default' | 'info' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
    case 'active':
      return 'info'
    case 'at_risk':
      return 'warning'
    case 'overdue':
    case 'missed':
      return 'error'
    default:
      return 'default'
  }
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MilestoneTimelineWidget({ milestones }: MilestoneTimelineWidgetProps) {
  const theme = useTheme()

  if (milestones.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          No milestones to display
        </Typography>
      </Box>
    )
  }

  // Sort by due_date ascending, nulls last
  const sorted = [...milestones].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return (
    <Box sx={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
      {/* Horizontal timeline */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          minWidth: sorted.length * 160,
          position: 'relative',
          pt: 2,
        }}
      >
        {/* Connecting line */}
        <Box
          sx={{
            position: 'absolute',
            top: 28,
            left: 20,
            right: 20,
            height: 2,
            bgcolor: 'divider',
          }}
        />

        {sorted.map((milestone) => {
          const overdue = milestone.status !== 'completed' && isOverdue(milestone.due_date)
          return (
            <Box
              key={milestone.id}
              sx={{
                flex: '0 0 auto',
                width: 150,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                px: 1,
              }}
            >
              {/* Dot */}
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor:
                    milestone.status === 'completed'
                      ? theme.palette.success.main
                      : overdue
                        ? theme.palette.error.main
                        : theme.palette.primary.main,
                  border: '2px solid',
                  borderColor: 'background.paper',
                  zIndex: 1,
                  mb: 1,
                }}
              />

              {/* Name */}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  textAlign: 'center',
                  lineHeight: 1.2,
                  mb: 0.5,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {milestone.name}
              </Typography>

              {/* Due date */}
              <Typography
                variant="caption"
                color={overdue ? 'error' : 'text.secondary'}
                sx={{ mb: 0.5 }}
              >
                {formatDate(milestone.due_date)}
              </Typography>

              {/* Status chip */}
              <Chip
                label={milestone.status.replace(/_/g, ' ')}
                size="small"
                color={statusColor(milestone.status)}
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  textTransform: 'capitalize',
                }}
              />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
