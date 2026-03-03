import { useState } from 'react'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import CircleIcon from '@mui/icons-material/Circle'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import type { WorkflowStatus } from '@/types/api'

const CATEGORY_COLORS: Record<string, string> = {
  todo: '#9e9e9e',
  in_progress: '#2196f3',
  done: '#4caf50',
}

interface StatusTransitionDropdownProps {
  currentStatusId: string
  statuses: WorkflowStatus[]
  onChange: (statusId: string) => void
}

export default function StatusTransitionDropdown({
  currentStatusId,
  statuses,
  onChange,
}: StatusTransitionDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const currentStatus = statuses.find((s) => s.id === currentStatusId)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (statusId: string) => {
    onChange(statusId)
    handleClose()
  }

  const statusColor = currentStatus
    ? CATEGORY_COLORS[currentStatus.category] ?? currentStatus.color
    : '#9e9e9e'

  const sortedStatuses = [...statuses].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        startIcon={
          <CircleIcon sx={{ fontSize: '12px !important', color: statusColor }} />
        }
        sx={{
          borderColor: statusColor,
          color: 'text.primary',
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': {
            borderColor: statusColor,
            bgcolor: 'action.hover',
          },
        }}
      >
        {currentStatus?.name ?? 'Unknown'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { minWidth: 200, mt: 0.5 } },
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, py: 0.5, display: 'block', fontWeight: 600 }}
        >
          Change status
        </Typography>

        {sortedStatuses.map((status) => {
          const color = CATEGORY_COLORS[status.category] ?? status.color
          const isActive = status.id === currentStatusId

          return (
            <MenuItem
              key={status.id}
              onClick={() => handleSelect(status.id)}
              selected={isActive}
              sx={{ py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CircleIcon sx={{ fontSize: 12, color }} />
              </ListItemIcon>
              <ListItemText
                primary={status.name}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
