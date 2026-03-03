import type { FC } from 'react'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import TableRowsIcon from '@mui/icons-material/TableRows'
import TimelineIcon from '@mui/icons-material/Timeline'

export type ViewType = 'board' | 'table' | 'timeline'

export interface ViewSwitcherProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const views: { value: ViewType; label: string; icon: React.ReactNode }[] = [
  { value: 'board', label: 'Board', icon: <ViewKanbanIcon fontSize="small" /> },
  { value: 'table', label: 'Table', icon: <TableRowsIcon fontSize="small" /> },
  {
    value: 'timeline',
    label: 'Timeline',
    icon: <TimelineIcon fontSize="small" />,
  },
]

const ViewSwitcher: FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextView: ViewType | null,
  ) => {
    // Prevent deselection — always keep one selected
    if (nextView !== null) {
      onViewChange(nextView)
    }
  }

  return (
    <ToggleButtonGroup
      value={currentView}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label="View switcher"
    >
      {views.map(({ value, label, icon }) => (
        <ToggleButton key={value} value={value} aria-label={label}>
          <Tooltip title={label}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {icon}
            </span>
          </Tooltip>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

export default ViewSwitcher
