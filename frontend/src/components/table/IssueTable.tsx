import { useRef, useCallback, useMemo } from 'react'
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
import Box from '@mui/material/Box'
import MuiTable from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
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
    return <Typography variant="body2">{'\u2014'}</Typography>
  }

  if (typeof value === 'object' && value !== null && 'type' in value) {
    const typed = value as Record<string, unknown>

    // Checkbox (select column)
    if (typed.type === 'checkbox') {
      return (
        <Checkbox
          size="small"
          checked={typed.checked as boolean}
          indeterminate={typed.indeterminate as boolean | undefined}
          disabled={typed.disabled as boolean | undefined}
          onChange={typed.onChange as React.ChangeEventHandler<HTMLInputElement>}
          onClick={(e) => e.stopPropagation()}
          sx={{ p: 0.5 }}
        />
      )
    }

    // Status chip
    if (typed.type === 'chip') {
      return (
        <Chip
          label={typed.label as string}
          size="small"
          sx={{
            bgcolor: typed.color as string,
            color: '#fff',
            fontWeight: 500,
            fontSize: '0.75rem',
          }}
        />
      )
    }

    // Priority (dot + label)
    if (typed.type === 'priority') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: typed.color as string,
              flexShrink: 0,
            }}
          />
          <Typography variant="body2">{typed.label as string}</Typography>
        </Box>
      )
    }

    // Assignee (avatar + name)
    if (typed.type === 'assignee') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={(typed.avatarUrl as string | null) ?? undefined}
            sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
          >
            {(typed.name as string).charAt(0)}
          </Avatar>
          <Typography variant="body2" noWrap>
            {typed.name as string}
          </Typography>
        </Box>
      )
    }

    // Progress bar
    if (typed.type === 'progress') {
      const pct = typed.value as number
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{ flex: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'right' }}>
            {pct}%
          </Typography>
        </Box>
      )
    }
  }

  // Fallback: plain string/number
  return <Typography variant="body2" noWrap>{String(value)}</Typography>
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
      <Box>
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, mb: 0.5, px: 1 }}>
            <Skeleton variant="text" width="8%" height={28} />
            <Skeleton variant="text" width="28%" height={28} />
            <Skeleton variant="text" width="12%" height={28} />
            <Skeleton variant="text" width="10%" height={28} />
            <Skeleton variant="text" width="14%" height={28} />
            <Skeleton variant="text" width="10%" height={28} />
            <Skeleton variant="text" width="8%" height={28} />
            <Skeleton variant="text" width="10%" height={28} />
          </Box>
        ))}
      </Box>
    )
  }

  // Memoize the header groups to avoid extra re-renders
  const headerGroups = table.getHeaderGroups()

  return (
    <TableContainer
      ref={parentRef}
      sx={{
        maxHeight: 'calc(100vh - 240px)',
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <MuiTable stickyHeader size="small" sx={{ minWidth: 900 }}>
        {/* ---- Header ---- */}
        <TableHead>
          {headerGroups.map((headerGroup) => (
            <TableRow key={headerGroup.id}>
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
                  'type' in (rendered as Record<string, unknown>) &&
                  (rendered as Record<string, unknown>).type === 'checkbox'

                return (
                  <TableCell
                    key={header.id}
                    sx={{
                      width: header.getSize(),
                      fontWeight: 600,
                      bgcolor: 'background.paper',
                      userSelect: 'none',
                    }}
                  >
                    {isCheckboxHeader ? (
                      <CellRenderer value={rendered} />
                    ) : canSort ? (
                      <TableSortLabel
                        active={!!sorted}
                        direction={sorted === 'desc' ? 'desc' : 'asc'}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {rendered as React.ReactNode}
                      </TableSortLabel>
                    ) : (
                      (rendered as React.ReactNode)
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableHead>

        {/* ---- Virtualized Body ---- */}
        <TableBody>
          {/* Spacer row before virtual window */}
          {virtualRows.length > 0 && virtualRows[0].start > 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{ height: virtualRows[0].start, p: 0, border: 0 }}
              />
            </TableRow>
          )}

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index]
            return (
              <TableRow
                key={row.id}
                hover
                selected={row.getIsSelected()}
                onClick={() => handleRowClick(row.original.id)}
                onDoubleClick={() => onIssueClick(row.original.id)}
                sx={{ cursor: 'pointer', height: ROW_HEIGHT }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} sx={{ py: 0.5, px: 1 }}>
                    <CellRenderer
                      value={flexRender(cell.column.columnDef.cell, cell.getContext())}
                    />
                  </TableCell>
                ))}
              </TableRow>
            )
          })}

          {/* Spacer row after virtual window */}
          {virtualRows.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{
                  height:
                    totalSize -
                    (virtualRows[virtualRows.length - 1].start +
                      virtualRows[virtualRows.length - 1].size),
                  p: 0,
                  border: 0,
                }}
              />
            </TableRow>
          )}

          {/* Empty state */}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  No issues found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  )
}
