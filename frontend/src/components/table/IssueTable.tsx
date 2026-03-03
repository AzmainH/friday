import { useRef, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Issue } from '@/types/api'

const ROW_HEIGHT = 44

export interface IssueTableProps {
  /** Issue data to render. */
  issues: Issue[]
  /** Column definitions from useTableColumns. */
  columns: ColumnDef<Issue, unknown>[]
  /** True while the initial data is loading. */
  isLoading: boolean
  /** Called when a row is clicked (single click). */
  onIssueClick: (id: string) => void
  /** Externally-controlled row selection state. */
  rowSelection: RowSelectionState
  /** Callback to update row selection. */
  onRowSelectionChange: (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void
  /** Externally-controlled sorting state. */
  sorting: SortingState
  /** Callback to update sorting. */
  onSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) => void
  /** Global filter string. */
  globalFilter?: string
}

/**
 * Renders a cell value based on the structured result from column definitions.
 */
function CellRenderer({ value }: { value: unknown }) {
  if (value == null) {
    return <span className="text-sm text-text-tertiary">{'\u2014'}</span>
  }

  if (typeof value === 'object' && value !== null && 'type' in value) {
    const typed = value as Record<string, unknown>

    // Checkbox (select column)
    if (typed.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
          checked={typed.checked as boolean}
          ref={(el) => {
            if (el) el.indeterminate = !!(typed.indeterminate as boolean | undefined)
          }}
          disabled={typed.disabled as boolean | undefined}
          onChange={typed.onChange as React.ChangeEventHandler<HTMLInputElement>}
          onClick={(e) => e.stopPropagation()}
        />
      )
    }

    // Status chip
    if (typed.type === 'chip') {
      return (
        <span
          className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: typed.color as string }}
        >
          {typed.label as string}
        </span>
      )
    }

    // Priority (dot + label)
    if (typed.type === 'priority') {
      return (
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: typed.color as string }}
          />
          <span className="text-sm text-text-primary">{typed.label as string}</span>
        </div>
      )
    }

    // Assignee (avatar + name)
    if (typed.type === 'assignee') {
      const avatarUrl = typed.avatarUrl as string | null
      const name = typed.name as string
      const initial = name.charAt(0)
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-6 h-6 rounded-full" alt={name} />
            ) : (
              initial
            )}
          </div>
          <span className="text-sm text-text-primary truncate">{name}</span>
        </div>
      )
    }

    // Progress bar
    if (typed.type === 'progress') {
      const pct = typed.value as number
      return (
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: pct + '%' }}
            />
          </div>
          <span className="text-xs text-text-secondary min-w-[32px] text-right">{pct}%</span>
        </div>
      )
    }
  }

  // Fallback: plain string/number
  return <span className="text-sm text-text-primary truncate">{String(value)}</span>
}

export default function IssueTable({
  issues,
  columns,
  isLoading,
  onIssueClick,
  rowSelection,
  onRowSelectionChange,
  sorting,
  onSortingChange,
  globalFilter,
}: IssueTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const table = useReactTable<Issue>({
    data: issues,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    onSortingChange: onSortingChange as never,
    onRowSelectionChange: onRowSelectionChange as never,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const handleRowClick = useCallback(
    (id: string) => {
      onIssueClick(id)
    },
    [onIssueClick],
  )

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex gap-4 mb-1 px-2">
            {[8, 28, 12, 10, 14, 10, 8, 10].map((w, j) => (
              <div
                key={j}
                className="skeleton-shimmer h-6 rounded"
                style={{ width: w + '%' }}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  // Memoize the header groups to avoid extra re-renders
  const headerGroups = table.getHeaderGroups()

  return (
    <div
      ref={parentRef}
      className="max-h-[calc(100vh-240px)] overflow-auto border border-surface-200 rounded-[--radius-sm]"
    >
      <table className="min-w-[900px] w-full text-sm">
        {/* ---- Header ---- */}
        <thead className="sticky top-0 z-10">
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-surface-50 dark:bg-surface-100">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()

                // Render the header value -- may be a render function or a string
                const rendered = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())

                // If the header result is a checkbox descriptor, render it
                const isCheckboxHeader =
                  typeof rendered === 'object' &&
                  rendered !== null &&
                  !Array.isArray(rendered) &&
                  'type' in (rendered as object) &&
                  (rendered as { type?: unknown }).type === 'checkbox'

                return (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-surface-200"
                    style={{ width: header.getSize() }}
                  >
                    {isCheckboxHeader ? (
                      <CellRenderer value={rendered} />
                    ) : canSort ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                      >
                        {rendered as React.ReactNode}
                        {sorted === 'asc' && <ChevronUp size={14} />}
                        {sorted === 'desc' && <ChevronDown size={14} />}
                        {!sorted && <span className="w-3.5" />}
                      </button>
                    ) : (
                      (rendered as React.ReactNode)
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>

        {/* ---- Virtualized Body ---- */}
        <tbody>
          {/* Spacer row before virtual window */}
          {virtualRows.length > 0 && virtualRows[0].start > 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ height: virtualRows[0].start }}
                className="p-0 border-0"
              />
            </tr>
          )}

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index]
            return (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row.original.id)}
                onDoubleClick={() => onIssueClick(row.original.id)}
                className={cn(
                  'border-b border-surface-100 cursor-pointer transition-colors',
                  row.getIsSelected()
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-surface-50/50',
                )}
                style={{ height: ROW_HEIGHT }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-1">
                    <CellRenderer
                      value={flexRender(cell.column.columnDef.cell, cell.getContext())}
                    />
                  </td>
                ))}
              </tr>
            )
          })}

          {/* Spacer row after virtual window */}
          {virtualRows.length > 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  height:
                    totalSize -
                    (virtualRows[virtualRows.length - 1].start +
                      virtualRows[virtualRows.length - 1].size),
                }}
                className="p-0 border-0"
              />
            </tr>
          )}

          {/* Empty state */}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-6">
                <span className="text-sm text-text-secondary">No issues found.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
