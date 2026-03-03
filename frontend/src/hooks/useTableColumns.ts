import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Issue } from '@/types/api'
import { PRIORITY_COLORS, formatDate, truncate } from '@/utils/formatters'
import { useProjectStore } from '@/stores/projectStore'

/**
 * Default column IDs in default display order.
 */
export const DEFAULT_COLUMNS = [
  'select',
  'issue_key',
  'summary',
  'status',
  'priority',
  'assignee',
  'due_date',
  'story_points',
  'percent_complete',
  'created_at',
] as const

export type IssueColumnId = (typeof DEFAULT_COLUMNS)[number]

/**
 * Returns TanStack Table v8 column definitions for the issue table.
 */
export function useTableColumns(): ColumnDef<Issue, unknown>[] {
  const statuses = useProjectStore((s) => s.statuses)

  return useMemo<ColumnDef<Issue, unknown>[]>(() => {
    const statusMap = new Map(statuses.map((s) => [s.id, s]))

    return [
      // -- Select (checkbox) column --
      {
        id: 'select',
        header: ({ table }) => ({
          type: 'checkbox' as const,
          checked: table.getIsAllRowsSelected(),
          indeterminate: table.getIsSomeRowsSelected(),
          onChange: table.getToggleAllRowsSelectedHandler(),
        }),
        cell: ({ row }) => ({
          type: 'checkbox' as const,
          checked: row.getIsSelected(),
          disabled: !row.getCanSelect(),
          onChange: row.getToggleSelectedHandler(),
        }),
        size: 48,
        enableSorting: false,
      },

      // -- Issue Key --
      {
        id: 'issue_key',
        accessorKey: 'issue_key',
        header: 'Key',
        cell: ({ getValue }) => getValue<string>(),
        size: 110,
        enableSorting: true,
      },

      // -- Summary --
      {
        id: 'summary',
        accessorKey: 'summary',
        header: 'Summary',
        cell: ({ getValue }) => truncate(getValue<string>(), 80),
        size: 360,
        enableSorting: true,
      },

      // -- Status (chip with color) --
      {
        id: 'status',
        accessorKey: 'status_id',
        header: 'Status',
        cell: ({ getValue }) => {
          const id = getValue<string>()
          const ws = statusMap.get(id)
          return {
            type: 'chip' as const,
            label: ws?.name ?? 'Unknown',
            color: ws?.color ?? '#9e9e9e',
          }
        },
        size: 140,
        enableSorting: true,
      },

      // -- Priority (colored dot + label) --
      {
        id: 'priority',
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => {
          const p = getValue<string>()
          return {
            type: 'priority' as const,
            label: p.charAt(0).toUpperCase() + p.slice(1),
            color: PRIORITY_COLORS[p] ?? PRIORITY_COLORS.none,
          }
        },
        size: 120,
        enableSorting: true,
      },

      // -- Assignee (avatar + name) --
      {
        id: 'assignee',
        accessorFn: (row) => row.assignee?.display_name ?? null,
        header: 'Assignee',
        cell: ({ row }) => {
          const assignee = row.original.assignee
          return {
            type: 'assignee' as const,
            name: assignee?.display_name ?? 'Unassigned',
            avatarUrl: assignee?.avatar_url ?? null,
          }
        },
        size: 160,
        enableSorting: true,
      },

      // -- Due Date --
      {
        id: 'due_date',
        accessorKey: 'due_date',
        header: 'Due Date',
        cell: ({ getValue }) => formatDate(getValue<string | null>()),
        size: 120,
        enableSorting: true,
      },

      // -- Story Points --
      {
        id: 'story_points',
        accessorKey: 'story_points',
        header: 'Points',
        cell: ({ getValue }) => {
          const v = getValue<number | null>()
          return v != null ? String(v) : '\u2014'
        },
        size: 80,
        enableSorting: true,
      },

      // -- Percent Complete (progress bar) --
      {
        id: 'percent_complete',
        accessorKey: 'percent_complete',
        header: '% Done',
        cell: ({ getValue }) => ({
          type: 'progress' as const,
          value: getValue<number>(),
        }),
        size: 120,
        enableSorting: true,
      },

      // -- Created At --
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => formatDate(getValue<string>()),
        size: 120,
        enableSorting: true,
      },
    ]
  }, [statuses])
}
