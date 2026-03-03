import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import DashboardGrid from '@/components/dashboard/DashboardGrid'
import WidgetPicker from '@/components/dashboard/WidgetPicker'
import type { WidgetTypeDefinition } from '@/components/dashboard/WidgetPicker'
import {
  useProjectDashboard,
  useSaveDashboard,
  type DashboardLayout,
  type DashboardWidget,
} from '@/hooks/useDashboard'

// ---------------------------------------------------------------------------
// Default layout for a fresh project dashboard
// ---------------------------------------------------------------------------

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'issues_by_status_1',
    type: 'issues_by_status',
    title: 'Issues by Status',
    config: { data: [] },
  },
  {
    id: 'progress_donut_1',
    type: 'progress_donut',
    title: 'Overall Progress',
    config: { done: 0, inProgress: 0, todo: 0 },
  },
  {
    id: 'burn_up_1',
    type: 'burn_up',
    title: 'Burn-Up',
    config: { data: [] },
  },
  {
    id: 'activity_feed_1',
    type: 'activity_feed',
    title: 'Recent Activity',
    config: { activities: [] },
  },
  {
    id: 'milestone_timeline_1',
    type: 'milestone_timeline',
    title: 'Milestones',
    config: { milestones: [] },
  },
]

const DEFAULT_LAYOUT: DashboardLayout[] = [
  { i: 'issues_by_status_1', x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'progress_donut_1', x: 4, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
  { i: 'burn_up_1', x: 7, y: 0, w: 5, h: 3, minW: 4, minH: 2 },
  { i: 'activity_feed_1', x: 0, y: 3, w: 5, h: 4, minW: 3, minH: 2 },
  { i: 'milestone_timeline_1', x: 5, y: 3, w: 7, h: 2, minW: 4, minH: 2 },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: dashboard, isLoading, error } = useProjectDashboard(projectId)
  const saveDashboard = useSaveDashboard()

  const [editable, setEditable] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Local state for layout / widgets while editing
  const [localLayout, setLocalLayout] = useState<DashboardLayout[]>(DEFAULT_LAYOUT)
  const [localWidgets, setLocalWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS)

  // Sync from server when data loads
  useEffect(() => {
    if (dashboard) {
      setLocalLayout(dashboard.layout.length > 0 ? dashboard.layout : DEFAULT_LAYOUT)
      setLocalWidgets(dashboard.widgets.length > 0 ? dashboard.widgets : DEFAULT_WIDGETS)
    }
  }, [dashboard])

  // Container width tracking
  const containerRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(1200)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setGridWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Layout change handler
  const handleLayoutChange = useCallback((newLayout: DashboardLayout[]) => {
    setLocalLayout(newLayout)
  }, [])

  // Save dashboard
  const handleSave = useCallback(() => {
    if (!projectId) return
    saveDashboard.mutate({
      id: dashboard?.id,
      name: 'Project Dashboard',
      scope: 'project',
      scope_id: projectId,
      layout_json: localLayout as unknown as Record<string, unknown>,
      widgets_json: localWidgets as unknown as Record<string, unknown>[],
    })
    setEditable(false)
  }, [projectId, dashboard?.id, localLayout, localWidgets, saveDashboard])

  // Add widget from picker
  const handleAddWidget = useCallback(
    (widgetType: WidgetTypeDefinition) => {
      const newId = `${widgetType.type}_${Date.now()}`
      const newWidget: DashboardWidget = {
        id: newId,
        type: widgetType.type,
        title: widgetType.label,
        config: {},
      }
      const newLayoutItem: DashboardLayout = {
        i: newId,
        x: 0,
        y: Infinity, // react-grid-layout will compact to the next open row
        w: widgetType.defaultSize.w,
        h: widgetType.defaultSize.h,
        minW: widgetType.defaultSize.minW,
        minH: widgetType.defaultSize.minH,
      }
      setLocalWidgets((prev) => [...prev, newWidget])
      setLocalLayout((prev) => [...prev, newLayoutItem])
    },
    [],
  )

  // Remove widget
  const handleRemoveWidget = useCallback((widgetId: string) => {
    setLocalWidgets((prev) => prev.filter((w) => w.id !== widgetId))
    setLocalLayout((prev) => prev.filter((l) => l.i !== widgetId))
  }, [])

  // Memoize layout/widgets for stability
  const layout = useMemo(() => localLayout, [localLayout])
  const widgets = useMemo(() => localWidgets, [localWidgets])

  // ---------- Render ----------

  if (isLoading) {
    return (
      <Container maxWidth={false} sx={{ py: 4, px: 3 }}>
        <Skeleton variant="text" width={260} height={40} />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Skeleton variant="rounded" width="33%" height={240} />
          <Skeleton variant="rounded" width="33%" height={240} />
          <Skeleton variant="rounded" width="33%" height={240} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth={false} sx={{ py: 4, px: 3 }}>
        <Alert severity="error">Failed to load project dashboard. Please try again.</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 3 }} ref={containerRef}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Project Dashboard
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {editable && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setPickerOpen(true)}
            >
              Add Widget
            </Button>
          )}
          {editable ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckIcon />}
              onClick={handleSave}
              disabled={saveDashboard.isPending}
            >
              {saveDashboard.isPending ? 'Saving...' : 'Done Editing'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => setEditable(true)}
            >
              Edit Dashboard
            </Button>
          )}
        </Box>
      </Box>

      {/* Grid */}
      <DashboardGrid
        layout={layout}
        widgets={widgets}
        onLayoutChange={handleLayoutChange}
        editable={editable}
        onRemoveWidget={handleRemoveWidget}
        width={gridWidth}
      />

      {/* Widget picker dialog */}
      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAddWidget={handleAddWidget}
      />
    </Container>
  )
}
