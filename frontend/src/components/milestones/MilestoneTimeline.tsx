import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Collapse from '@mui/material/Collapse'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import type { Milestone } from '@/types/api'
import { formatDate } from '@/utils/formatters'

// ---- Status color mapping ----

const STATUS_COLORS: Record<string, string> = {
  not_started: '#9e9e9e',
  in_progress: '#2196f3',
  completed: '#4caf50',
  blocked: '#f44336',
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? '#9e9e9e'
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

// ---- Props ----

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

// ---- Component ----

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Sort milestones by due_date (nulls last)
  const sorted = [...milestones].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  if (sorted.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No milestones yet. Create one to get started.
        </Typography>
      </Box>
    )
  }

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <Box sx={{ position: 'relative', py: 3 }}>
      {/* Horizontal axis line */}
      <Box
        sx={{
          position: 'absolute',
          top: 56,
          left: 24,
          right: 24,
          height: 2,
          bgcolor: 'divider',
          zIndex: 0,
        }}
      />

      {/* Milestone markers */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
          px: 3,
          overflowX: 'auto',
          gap: 2,
          minHeight: 120,
        }}
      >
        {sorted.map((milestone) => {
          const color = getStatusColor(milestone.status)
          const isExpanded = expandedId === milestone.id

          return (
            <Box
              key={milestone.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 120,
                flex: '1 0 auto',
                cursor: 'pointer',
              }}
              onClick={() => handleToggle(milestone.id)}
            >
              {/* Name above the marker */}
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{
                  mb: 0.5,
                  textAlign: 'center',
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {milestone.name}
              </Typography>

              {/* Diamond / circle icon */}
              <Tooltip
                title={`${getStatusLabel(milestone.status)} - ${formatDate(milestone.due_date)}`}
                arrow
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: color,
                    borderRadius: milestone.milestone_type === 'gate' ? '2px' : '50%',
                    transform:
                      milestone.milestone_type === 'gate' ? 'rotate(45deg)' : 'none',
                    border: '3px solid',
                    borderColor: 'background.paper',
                    boxShadow: `0 0 0 2px ${color}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: `0 0 0 3px ${color}`,
                    },
                  }}
                />
              </Tooltip>

              {/* Date below */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {formatDate(milestone.due_date)}
              </Typography>

              {/* Status chip */}
              <Chip
                label={getStatusLabel(milestone.status)}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.675rem',
                  bgcolor: `${color}20`,
                  color,
                  fontWeight: 600,
                }}
              />

              {/* Expandable detail panel */}
              <Collapse in={isExpanded} unmountOnExit>
                <Paper
                  elevation={2}
                  sx={{
                    mt: 1,
                    p: 1.5,
                    minWidth: 200,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  {milestone.description && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {milestone.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block">
                    Type: {milestone.milestone_type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Start: {formatDate(milestone.start_date)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Due: {formatDate(milestone.due_date)}
                  </Typography>
                  {milestone.completed_date && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Completed: {formatDate(milestone.completed_date)}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block">
                    Progress: {milestone.progress_pct}%
                  </Typography>
                </Paper>
              </Collapse>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
