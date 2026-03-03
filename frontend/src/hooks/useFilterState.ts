import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface DateRange {
  from: string
  to: string
}

export interface FilterState {
  statusIds: string[]
  assigneeIds: string[]
  priorities: string[]
  search: string
  dateRange: DateRange | null
}

export type FilterKey = keyof FilterState

const EMPTY_FILTERS: FilterState = {
  statusIds: [],
  assigneeIds: [],
  priorities: [],
  search: '',
  dateRange: null,
}

function parseFiltersFromParams(params: URLSearchParams): FilterState {
  const statusIds = params.get('status')?.split(',').filter(Boolean) ?? []
  const assigneeIds = params.get('assignee')?.split(',').filter(Boolean) ?? []
  const priorities = params.get('priority')?.split(',').filter(Boolean) ?? []
  const search = params.get('search') ?? ''

  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')
  const dateRange =
    dateFrom && dateTo ? { from: dateFrom, to: dateTo } : null

  return { statusIds, assigneeIds, priorities, search, dateRange }
}

function writeFiltersToParams(
  filters: FilterState,
  existing: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(existing)

  // Preserve non-filter params (like "view")
  for (const key of ['status', 'assignee', 'priority', 'search', 'dateFrom', 'dateTo']) {
    params.delete(key)
  }

  if (filters.statusIds.length > 0) {
    params.set('status', filters.statusIds.join(','))
  }
  if (filters.assigneeIds.length > 0) {
    params.set('assignee', filters.assigneeIds.join(','))
  }
  if (filters.priorities.length > 0) {
    params.set('priority', filters.priorities.join(','))
  }
  if (filters.search) {
    params.set('search', filters.search)
  }
  if (filters.dateRange) {
    params.set('dateFrom', filters.dateRange.from)
    params.set('dateTo', filters.dateRange.to)
  }

  return params
}

export function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  )

  const setFilter = useCallback(
    <K extends FilterKey>(key: K, value: FilterState[K]) => {
      setSearchParams((prev) => {
        const current = parseFiltersFromParams(prev)
        const updated = { ...current, [key]: value }
        return writeFiltersToParams(updated, prev)
      }, { replace: true })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      return writeFiltersToParams(EMPTY_FILTERS, prev)
    }, { replace: true })
  }, [setSearchParams])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.statusIds.length > 0) count++
    if (filters.assigneeIds.length > 0) count++
    if (filters.priorities.length > 0) count++
    if (filters.search) count++
    if (filters.dateRange) count++
    return count
  }, [filters])

  return { filters, setFilter, clearFilters, activeFilterCount } as const
}
