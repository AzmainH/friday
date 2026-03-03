import { useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import CloseIcon from '@mui/icons-material/Close'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import type { WorkflowStatus, IssueType } from '@/types/api'
import type { FilterState, DateRange } from '@/hooks/useFilterState'
import { PRIORITY_COLORS } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterBarProps {
  filters: FilterState
  onFilterChange: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => void
  statuses: WorkflowStatus[]
  issueTypes: IssueType[]
  onClearAll?: () => void
}

// ---------------------------------------------------------------------------
// Priorities constant
// ---------------------------------------------------------------------------

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'] as const

// ---------------------------------------------------------------------------
// Sub-component: Multi-select dropdown as a chip-triggered menu
// ---------------------------------------------------------------------------

interface MultiSelectChipProps {
  label: string
  options: { id: string; label: string; color?: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
}

const MultiSelectChip: FC<MultiSelectChipProps> = ({
  label,
  options,
  selected,
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handleToggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id]
    onChange(next)
  }

  const chipLabel =
    selected.length > 0 ? `${label} (${selected.length})` : label

  return (
    <>
      <Chip
        icon={<FilterListIcon fontSize="small" />}
        label={chipLabel}
        variant={selected.length > 0 ? 'filled' : 'outlined'}
        color={selected.length > 0 ? 'primary' : 'default'}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
        sx={{ cursor: 'pointer' }}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { maxHeight: 320, minWidth: 200 } } }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.id} dense onClick={() => handleToggle(opt.id)}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Checkbox
                size="small"
                checked={selected.includes(opt.id)}
                disableRipple
                tabIndex={-1}
              />
            </ListItemIcon>
            {opt.color && (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: opt.color,
                  mr: 1,
                  flexShrink: 0,
                }}
              />
            )}
            <ListItemText primary={opt.label} />
          </MenuItem>
        ))}
        {options.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary="No options" />
          </MenuItem>
        )}
      </Menu>
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Date range picker (simple popover with two date inputs)
// ---------------------------------------------------------------------------

interface DateRangePickerChipProps {
  dateRange: DateRange | null
  onChange: (range: DateRange | null) => void
}

const DateRangePickerChip: FC<DateRangePickerChipProps> = ({
  dateRange,
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [from, setFrom] = useState(dateRange?.from ?? '')
  const [to, setTo] = useState(dateRange?.to ?? '')

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setFrom(dateRange?.from ?? '')
    setTo(dateRange?.to ?? '')
    setAnchorEl(e.currentTarget)
  }

  const handleApply = () => {
    if (from && to) {
      onChange({ from, to })
    }
    setAnchorEl(null)
  }

  const handleClear = () => {
    onChange(null)
    setAnchorEl(null)
  }

  const chipLabel = dateRange
    ? `${dateRange.from} - ${dateRange.to}`
    : 'Date range'

  return (
    <>
      <Chip
        label={chipLabel}
        variant={dateRange ? 'filled' : 'outlined'}
        color={dateRange ? 'primary' : 'default'}
        onClick={handleOpen}
        size="small"
        onDelete={dateRange ? handleClear : undefined}
        sx={{ cursor: 'pointer' }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 240 }}>
          <Typography variant="subtitle2">Date range</Typography>
          <TextField
            type="date"
            label="From"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="To"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={handleClear}>
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleApply}
              disabled={!from || !to}
            >
              Apply
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  )
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

const FilterBar: FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  statuses,
  onClearAll,
}) => {
  const hasActiveFilters =
    filters.statusIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.priorities.length > 0 ||
    filters.search !== '' ||
    filters.dateRange !== null

  const statusOptions = statuses.map((s) => ({
    id: s.id,
    label: s.name,
    color: s.color,
  }))

  const priorityOptions = PRIORITIES.map((p) => ({
    id: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
    color: PRIORITY_COLORS[p],
  }))

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        py: 1,
      }}
    >
      {/* Search field */}
      <TextField
        size="small"
        placeholder="Search issues..."
        value={filters.search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onFilterChange('search', '')}
                  edge="end"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
        sx={{ minWidth: 200 }}
      />

      {/* Status multi-select */}
      <MultiSelectChip
        label="Status"
        options={statusOptions}
        selected={filters.statusIds}
        onChange={(ids) => onFilterChange('statusIds', ids)}
      />

      {/* Priority multi-select */}
      <MultiSelectChip
        label="Priority"
        options={priorityOptions}
        selected={filters.priorities}
        onChange={(vals) => onFilterChange('priorities', vals)}
      />

      {/* Date range picker */}
      <DateRangePickerChip
        dateRange={filters.dateRange}
        onChange={(range) => onFilterChange('dateRange', range)}
      />

      {/* Active filter chips (removable) */}
      {filters.statusIds.length > 0 &&
        filters.statusIds.map((id) => {
          const status = statuses.find((s) => s.id === id)
          return (
            <Chip
              key={`status-${id}`}
              label={status?.name ?? id}
              size="small"
              onDelete={() =>
                onFilterChange(
                  'statusIds',
                  filters.statusIds.filter((s) => s !== id),
                )
              }
              sx={{
                bgcolor: status?.color ?? undefined,
                color: status?.color ? '#fff' : undefined,
              }}
            />
          )
        })}

      {filters.priorities.length > 0 &&
        filters.priorities.map((p) => (
          <Chip
            key={`priority-${p}`}
            label={p.charAt(0).toUpperCase() + p.slice(1)}
            size="small"
            onDelete={() =>
              onFilterChange(
                'priorities',
                filters.priorities.filter((x) => x !== p),
              )
            }
            sx={{
              bgcolor: PRIORITY_COLORS[p],
              color: '#fff',
            }}
          />
        ))}

      {/* Clear all */}
      {hasActiveFilters && (
        <Button
          size="small"
          startIcon={<ClearAllIcon />}
          onClick={onClearAll}
          sx={{ ml: 'auto' }}
        >
          Clear all
        </Button>
      )}
    </Box>
  )
}

export default FilterBar
