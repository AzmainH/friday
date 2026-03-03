import { useState, type MouseEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import PersonIcon from '@mui/icons-material/Person'
import FlagIcon from '@mui/icons-material/Flag'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useProjectStore } from '@/stores/projectStore'

export type BulkActionKind = 'status' | 'assignee' | 'priority' | 'delete'

export interface BulkActionToolbarProps {
  /** Number of currently selected rows. */
  selectedCount: number
  /** Called when a bulk action is confirmed. */
  onBulkAction: (action: BulkActionKind, value?: string) => void
  /** Clear the current selection. */
  onClearSelection: () => void
}

const PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' },
]

export default function BulkActionToolbar({
  selectedCount,
  onBulkAction,
  onClearSelection,
}: BulkActionToolbarProps) {
  const statuses = useProjectStore((s) => s.statuses)

  // Anchor elements for the three picker menus
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null)
  const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(null)

  const openStatus = (e: MouseEvent<HTMLButtonElement>) => setStatusAnchor(e.currentTarget)
  const closeStatus = () => setStatusAnchor(null)

  const openPriority = (e: MouseEvent<HTMLButtonElement>) => setPriorityAnchor(e.currentTarget)
  const closePriority = () => setPriorityAnchor(null)

  if (selectedCount === 0) return null

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: 1,
        mb: 1,
      }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ mr: 1 }}>
        {selectedCount} selected
      </Typography>

      {/* ---- Change Status ---- */}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<SwapHorizIcon />}
        onClick={openStatus}
      >
        Status
      </Button>
      <Menu anchorEl={statusAnchor} open={Boolean(statusAnchor)} onClose={closeStatus}>
        {statuses.map((s) => (
          <MenuItem
            key={s.id}
            onClick={() => {
              onBulkAction('status', s.id)
              closeStatus()
            }}
          >
            <Box
              component="span"
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: s.color,
                mr: 1,
                display: 'inline-block',
              }}
            />
            {s.name}
          </MenuItem>
        ))}
      </Menu>

      {/* ---- Change Assignee (placeholder -- opens action with no picker) ---- */}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<PersonIcon />}
        onClick={() => onBulkAction('assignee')}
      >
        Assignee
      </Button>

      {/* ---- Change Priority ---- */}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<FlagIcon />}
        onClick={openPriority}
      >
        Priority
      </Button>
      <Menu anchorEl={priorityAnchor} open={Boolean(priorityAnchor)} onClose={closePriority}>
        {PRIORITIES.map((p) => (
          <MenuItem
            key={p.value}
            onClick={() => {
              onBulkAction('priority', p.value)
              closePriority()
            }}
          >
            {p.label}
          </MenuItem>
        ))}
      </Menu>

      {/* ---- Delete ---- */}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<DeleteOutlineIcon />}
        onClick={() => onBulkAction('delete')}
      >
        Delete
      </Button>

      {/* ---- Clear selection ---- */}
      <Box sx={{ flex: 1 }} />
      <IconButton size="small" color="inherit" onClick={onClearSelection} aria-label="Clear selection">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}
