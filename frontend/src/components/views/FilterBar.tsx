import { useState, type FC } from 'react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Menu, MenuButton, MenuItems, MenuItem } from '@/components/ui/Menu'
import { Search, Filter, X, Trash2 } from 'lucide-react'
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
  const handleToggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id]
    onChange(next)
  }

  const chipLabel =
    selected.length > 0 ? `${label} (${selected.length})` : label

  return (
    <Menu>
      <MenuButton
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer',
          selected.length > 0
            ? 'bg-primary-50 text-primary-700 border-primary-200'
            : 'bg-white text-text-secondary border-surface-200 hover:border-surface-300 dark:bg-surface-100',
        )}
      >
        <Filter size={14} />
        {chipLabel}
      </MenuButton>
      <MenuItems className="max-h-[320px] min-w-[200px] overflow-auto">
        {options.map((opt) => (
          <MenuItem key={opt.id} onClick={() => handleToggle(opt.id)}>
            <div className="flex items-center gap-2 w-full">
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                readOnly
                className="w-3.5 h-3.5 rounded border-surface-300 text-primary-500"
              />
              {opt.color && (
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
              )}
              <span>{opt.label}</span>
            </div>
          </MenuItem>
        ))}
        {options.length === 0 && (
          <div className="px-3 py-2 text-sm text-text-tertiary">No options</div>
        )}
      </MenuItems>
    </Menu>
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
  const [from, setFrom] = useState(dateRange?.from ?? '')
  const [to, setTo] = useState(dateRange?.to ?? '')

  const handleApply = () => {
    if (from && to) {
      onChange({ from, to })
    }
  }

  const handleClear = () => {
    onChange(null)
  }

  const chipLabel = dateRange
    ? `${dateRange.from} - ${dateRange.to}`
    : 'Date range'

  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer',
          dateRange
            ? 'bg-primary-50 text-primary-700 border-primary-200'
            : 'bg-white text-text-secondary border-surface-200 hover:border-surface-300 dark:bg-surface-100',
        )}
        onClick={() => {
          setFrom(dateRange?.from ?? '')
          setTo(dateRange?.to ?? '')
        }}
      >
        {chipLabel}
        {dateRange && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="ml-1"
          >
            <X size={12} />
          </button>
        )}
      </PopoverButton>
      <PopoverPanel className="absolute z-50 mt-2 p-4 bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-md] shadow-lg min-w-[240px]">
        <p className="text-sm font-semibold text-text-primary mb-3">Date range</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-sm] outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-sm] outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={handleApply} disabled={!from || !to}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverPanel>
    </Popover>
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
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Search field */}
      <div className="relative min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          placeholder="Search issues..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-sm] outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary placeholder:text-text-tertiary"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange('search', '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-text-tertiary hover:text-text-secondary"
          >
            <X size={14} />
          </button>
        )}
      </div>

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
            <span
              key={`status-${id}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: status?.color ?? '#6b7280' }}
            >
              {status?.name ?? id}
              <button
                onClick={() =>
                  onFilterChange(
                    'statusIds',
                    filters.statusIds.filter((s) => s !== id),
                  )
                }
                className="ml-0.5 hover:opacity-80"
              >
                <X size={12} />
              </button>
            </span>
          )
        })}

      {filters.priorities.length > 0 &&
        filters.priorities.map((p) => (
          <span
            key={`priority-${p}`}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-white"
            style={{ backgroundColor: PRIORITY_COLORS[p] }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
            <button
              onClick={() =>
                onFilterChange(
                  'priorities',
                  filters.priorities.filter((x) => x !== p),
                )
              }
              className="ml-0.5 hover:opacity-80"
            >
              <X size={12} />
            </button>
          </span>
        ))}

      {/* Clear all */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="ml-auto">
          <Trash2 size={14} className="mr-1" />
          Clear all
        </Button>
      )}
    </div>
  )
}

export default FilterBar
