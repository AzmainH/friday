import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import type { Issue, WorkflowStatus } from '@/types/api'
import BoardColumn from '@/components/board/BoardColumn'

interface BoardSwimlaneProps {
  /** Display label for the swimlane row (e.g. assignee name or priority level) */
  label: string
  /** Ordered list of statuses that define the columns */
  statuses: WorkflowStatus[]
  /** Map of status_id -> issues for this swimlane's slice */
  issuesByStatus: Map<string, Issue[]>
  /** Callback when "+" is clicked in a column header */
  onAddIssue: (statusId: string) => void
}

/**
 * Optional swimlane grouping row for the Kanban board.
 * Renders a collapsible horizontal row with a label header, containing
 * one BoardColumn per workflow status.
 *
 * Swimlanes can be used to group issues by assignee, priority, or any
 * other dimension. The parent component is responsible for slicing the
 * issue data and creating one BoardSwimlane per group.
 */
export default function BoardSwimlane({
  label,
  statuses,
  issuesByStatus,
  onAddIssue,
}: BoardSwimlaneProps) {
  const [expanded, setExpanded] = useState(true)

  // Count total issues across all columns in this swimlane
  let totalIssues = 0
  for (const [, issues] of issuesByStatus) {
    totalIssues += issues.length
  }

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Swimlane header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: 'action.hover',
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: 'action.selected' },
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <IconButton size="small" sx={{ width: 24, height: 24 }}>
          {expanded ? (
            <ExpandLessIcon sx={{ fontSize: 18 }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>

        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          ({totalIssues} {totalIssues === 1 ? 'issue' : 'issues'})
        </Typography>
      </Box>

      {/* Swimlane body: horizontally scrollable columns */}
      <Collapse in={expanded}>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            p: 1.5,
            overflowX: 'auto',
            minHeight: expanded ? 120 : 0,
          }}
        >
          {statuses.map((status) => (
            <BoardColumn
              key={status.id}
              status={status}
              issues={issuesByStatus.get(status.id) ?? []}
              onAddIssue={() => onAddIssue(status.id)}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
