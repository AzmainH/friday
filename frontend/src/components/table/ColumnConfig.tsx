import { useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

export interface ColumnInfo {
  id: string
  label: string
}

export interface ColumnConfigProps {
  /** Popover anchor element (null = closed). */
  anchorEl: HTMLElement | null
  /** Called to close the popover. */
  onClose: () => void
  /** All available columns (in current order). */
  columns: ColumnInfo[]
  /** IDs of currently visible columns. */
  visibleColumns: string[]
  /** Toggle visibility of a column. */
  onToggle: (columnId: string) => void
  /** Reorder columns (receives new ordered ID array). */
  onReorder: (newOrder: string[]) => void
  /** Reset to default visibility and order. */
  onReset: () => void
}

export default function ColumnConfig({
  anchorEl,
  onClose,
  columns,
  visibleColumns,
  onToggle,
  onReorder,
  onReset,
}: ColumnConfigProps) {
  const open = Boolean(anchorEl)

  const moveColumn = useCallback(
    (index: number, direction: -1 | 1) => {
      const ids = columns.map((c) => c.id)
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= ids.length) return
      const copy = [...ids]
      ;[copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]]
      onReorder(copy)
    },
    [columns, onReorder],
  )

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: { sx: { width: 280, maxHeight: 420, p: 1 } },
      }}
    >
      <Typography variant="subtitle2" sx={{ px: 1, pt: 0.5, pb: 1 }}>
        Configure Columns
      </Typography>
      <Divider />

      <Box sx={{ overflowY: 'auto', maxHeight: 300, py: 0.5 }}>
        {columns.map((col, index) => {
          // The "select" column cannot be hidden or reordered
          const isFixed = col.id === 'select'
          return (
            <Box
              key={col.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 0.5,
                '&:hover': { bgcolor: 'action.hover' },
                borderRadius: 0.5,
              }}
            >
              {/* Drag / reorder handle area */}
              <Box sx={{ display: 'flex', flexDirection: 'column', mr: 0.5 }}>
                {!isFixed && (
                  <>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => moveColumn(index, -1)}
                      sx={{ p: 0.25 }}
                      aria-label={`Move ${col.label} up`}
                    >
                      <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={index === columns.length - 1}
                      onClick={() => moveColumn(index, 1)}
                      sx={{ p: 0.25 }}
                      aria-label={`Move ${col.label} down`}
                    >
                      <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </>
                )}
                {isFixed && <DragHandleIcon sx={{ fontSize: 16, color: 'text.disabled', mx: 0.5 }} />}
              </Box>

              <FormControlLabel
                sx={{ flex: 1, m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={visibleColumns.includes(col.id)}
                    onChange={() => onToggle(col.id)}
                    disabled={isFixed}
                  />
                }
                label={
                  <Typography variant="body2" noWrap>
                    {col.label}
                  </Typography>
                }
              />
            </Box>
          )
        })}
      </Box>

      <Divider sx={{ my: 0.5 }} />
      <Button size="small" onClick={onReset} fullWidth>
        Reset to defaults
      </Button>
    </Popover>
  )
}
