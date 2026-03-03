import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Pencil, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
      <div className="w-full py-8 px-6">
        <div className="skeleton-shimmer h-10 w-64 rounded mb-4" />
        <div className="flex gap-4 mt-4">
          <div className="skeleton-shimmer w-1/3 h-[240px] rounded-[--radius-md]" />
          <div className="skeleton-shimmer w-1/3 h-[240px] rounded-[--radius-md]" />
          <div className="skeleton-shimmer w-1/3 h-[240px] rounded-[--radius-md]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full py-8 px-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[--radius-sm] text-sm">
          Failed to load project dashboard. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 px-6" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-text-primary">Project Dashboard</h1>

        <div className="flex gap-2">
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setPickerOpen(true)}
            >
              Add Widget
            </Button>
          )}
          {editable ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check className="h-4 w-4" />}
              onClick={handleSave}
              disabled={saveDashboard.isPending}
            >
              {saveDashboard.isPending ? 'Saving...' : 'Done Editing'}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => setEditable(true)}
            >
              Edit Dashboard
            </Button>
          )}
        </div>
      </div>

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
    </div>
  )
}
