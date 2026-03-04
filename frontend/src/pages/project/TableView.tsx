import { useState, useCallback, useMemo, type MouseEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RowSelectionState, SortingState } from '@tanstack/react-table'
import { Columns3 } from 'lucide-react'
import { listIssues, updateIssue, deleteIssue } from '@/api/issues'
import { useProjectStore } from '@/stores/projectStore'
import { useTableColumns } from '@/hooks/useTableColumns'
import { useColumnPreferences } from '@/hooks/useColumnPreferences'
import IssueTable from '@/components/table/IssueTable'
import BulkActionToolbar, { type BulkActionKind } from '@/components/table/BulkActionToolbar'
import ColumnConfig, { type ColumnInfo } from '@/components/table/ColumnConfig'

/** Human-readable labels for every column ID. */
const COLUMN_LABELS: Record<string, string> = {
  select: 'Select',
  issue_key: 'Key',
  summary: 'Summary',
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assignee',
  due_date: 'Due Date',
  story_points: 'Points',
  percent_complete: '% Done',
  created_at: 'Created',
}

interface TableViewProps {
  onIssueClick?: (id: string) => void
}

export default function TableView({ onIssueClick }: TableViewProps) {
  const queryClient = useQueryClient()
  const currentProject = useProjectStore((s) => s.currentProject)
  const projectId = currentProject?.id ?? ''

  // ---- Data fetching ----
  const { data, isLoading } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => listIssues({ project_id: projectId, limit: 200, include_count: true }),
    enabled: !!projectId,
  })
  const issues = data?.data ?? []

  // ---- Column preferences ----
  const { visibleColumns, columnOrder, toggleColumn, reorderColumns, resetToDefaults } =
    useColumnPreferences()

  const allColumnDefs = useTableColumns()

  // Filter and reorder columns based on preferences
  const columns = useMemo(() => {
    const orderedIds = columnOrder.filter((id) => visibleColumns.includes(id))
    return orderedIds
      .map((id) => allColumnDefs.find((c) => c.id === id))
      .filter(Boolean) as typeof allColumnDefs
  }, [allColumnDefs, visibleColumns, columnOrder])

  // Column info list for the config popover (in current order)
  const columnInfoList: ColumnInfo[] = useMemo(
    () => columnOrder.map((id) => ({ id, label: COLUMN_LABELS[id] ?? id })),
    [columnOrder],
  )

  // ---- Selection state ----
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const selectedIds = useMemo(() => Object.keys(rowSelection).filter((k) => rowSelection[k]), [rowSelection])

  // ---- Sorting state ----
  const [sorting, setSorting] = useState<SortingState>([])

  // ---- Column config popover ----
  const [configAnchor, setConfigAnchor] = useState<HTMLElement | null>(null)
  const openConfig = (e: MouseEvent<HTMLButtonElement>) => setConfigAnchor(e.currentTarget)
  const closeConfig = () => setConfigAnchor(null)

  // ---- Mutations for bulk actions ----
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => updateIssue(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIssue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
  })

  const handleBulkAction = useCallback(
    (action: BulkActionKind, value?: string) => {
      if (selectedIds.length === 0) return

      if (action === 'delete') {
        selectedIds.forEach((id) => deleteMutation.mutate(id))
        setRowSelection({})
        return
      }

      const fieldMap: Record<string, string> = {
        status: 'status_id',
        priority: 'priority',
        assignee: 'assignee_id',
      }
      const field = fieldMap[action]
      if (!field || !value) return

      selectedIds.forEach((id) => {
        updateMutation.mutate({ id, body: { [field]: value } })
      })
      setRowSelection({})
    },
    [selectedIds, updateMutation, deleteMutation],
  )

  const clearSelection = useCallback(() => setRowSelection({}), [])

  const handleIssueClick = useCallback((id: string) => {
    onIssueClick?.(id)
  }, [onIssueClick])

  // ---- Render ----

  if (!projectId) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Select a project to view issues.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-text-primary">Issues</h2>
        <button
          onClick={openConfig}
          className="p-1.5 rounded-[--radius-sm] text-text-tertiary hover:bg-surface-100 hover:text-text-secondary transition-colors"
          title="Configure columns"
        >
          <Columns3 size={20} />
        </button>
      </div>

      {/* Bulk action toolbar (visible when rows are selected) */}
      <BulkActionToolbar
        selectedCount={selectedIds.length}
        onBulkAction={handleBulkAction}
        onClearSelection={clearSelection}
      />

      {/* The main table */}
      <IssueTable
        issues={issues}
        columns={columns}
        isLoading={isLoading}
        onIssueClick={handleIssueClick}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        sorting={sorting}
        onSortingChange={setSorting}
      />

      {/* Column configuration popover */}
      <ColumnConfig
        anchorEl={configAnchor}
        onClose={closeConfig}
        columns={columnInfoList}
        visibleColumns={visibleColumns}
        onToggle={toggleColumn}
        onReorder={reorderColumns}
        onReset={resetToDefaults}
      />
    </div>
  )
}
