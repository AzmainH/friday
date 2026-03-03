import { useState, useCallback, useMemo, type MouseEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RowSelectionState, SortingState } from '@tanstack/react-table'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import { listIssues, updateIssue, deleteIssue } from '@/api/issues'
import { useProjectStore } from '@/stores/projectStore'
import { useTableColumns, DEFAULT_COLUMNS } from '@/hooks/useTableColumns'
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

export default function TableView() {
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
    // Navigate to issue detail -- can be wired to router later
    console.log('Navigate to issue:', id)
  }, [])

  // ---- Render ----

  if (!projectId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Select a project to view issues.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">Issues</Typography>
        <Tooltip title="Configure columns">
          <IconButton size="small" onClick={openConfig}>
            <ViewColumnIcon />
          </IconButton>
        </Tooltip>
      </Box>

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
    </Box>
  )
}
