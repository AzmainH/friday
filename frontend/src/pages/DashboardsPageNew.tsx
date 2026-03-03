import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Pencil, Check, Plus, ClipboardList, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import DashboardGrid from '@/components/dashboard/DashboardGrid'
import WidgetPicker from '@/components/dashboard/WidgetPicker'
import type { WidgetTypeDefinition } from '@/components/dashboard/WidgetPicker'
import {
  usePersonalDashboard,
  useSaveDashboard,
  type DashboardLayout,
  type DashboardWidget,
} from '@/hooks/useDashboard'

// ---------------------------------------------------------------------------
// Default personal dashboard widgets
// ---------------------------------------------------------------------------

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'my_issues_1',
    type: 'my_issues',
    title: 'My Issues',
    config: {},
  },
  {
    id: 'overdue_1',
    type: 'overdue',
    title: 'Overdue',
    config: {},
  },
  {
    id: 'activity_feed_1',
    type: 'activity_feed',
    title: 'Recent Activity',
    config: { activities: [] },
  },
  {
    id: 'favorites_1',
    type: 'favorites',
    title: 'Favorites',
    config: {},
  },
  {
    id: 'projects_overview_1',
    type: 'projects_overview',
    title: 'Projects Overview',
    config: {},
  },
]

const DEFAULT_LAYOUT: DashboardLayout[] = [
  { i: 'my_issues_1', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'overdue_1', x: 3, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'activity_feed_1', x: 5, y: 0, w: 4, h: 4, minW: 3, minH: 2 },
  { i: 'favorites_1', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
  { i: 'projects_overview_1', x: 0, y: 2, w: 5, h: 3, minW: 4, minH: 2 },
]

// ---------------------------------------------------------------------------
// Simple stat card for My Issues / Overdue
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 p-4 border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
      <div className="flex items-center" style={{ color }}>
        {icon}
      </div>
      <span className="text-3xl font-bold text-text-primary">{value}</span>
      <span className="text-sm text-text-secondary">{title}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardsPageNew() {
  const { data: dashboard, isLoading, error } = usePersonalDashboard()
  const saveDashboard = useSaveDashboard()

  const [editable, setEditable] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Local mutable state
  const [localLayout, setLocalLayout] = useState<DashboardLayout[]>(DEFAULT_LAYOUT)
  const [localWidgets, setLocalWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS)

  // Sync from server
  useEffect(() => {
    if (dashboard) {
      setLocalLayout(dashboard.layout.length > 0 ? dashboard.layout : DEFAULT_LAYOUT)
      setLocalWidgets(dashboard.widgets.length > 0 ? dashboard.widgets : DEFAULT_WIDGETS)
    }
  }, [dashboard])

  // Container width
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

  const handleLayoutChange = useCallback((newLayout: DashboardLayout[]) => {
    setLocalLayout(newLayout)
  }, [])

  const handleSave = useCallback(() => {
    saveDashboard.mutate({
      id: dashboard?.id,
      name: 'Personal Dashboard',
      scope: 'personal',
      layout_json: localLayout as unknown as Record<string, unknown>,
      widgets_json: localWidgets as unknown as Record<string, unknown>[],
    })
    setEditable(false)
  }, [dashboard?.id, localLayout, localWidgets, saveDashboard])

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
        y: Infinity,
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

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setLocalWidgets((prev) => prev.filter((w) => w.id !== widgetId))
    setLocalLayout((prev) => prev.filter((l) => l.i !== widgetId))
  }, [])

  const layout = useMemo(() => localLayout, [localLayout])
  const widgets = useMemo(() => localWidgets, [localWidgets])

  // Override widget renderer for personal-specific widgets (my_issues, overdue)
  // The DashboardGrid handles known widget types. For personal stat widgets
  // that don't have a dedicated chart component, we render a stat card wrapper
  // via the widget config. This pattern keeps the grid generic.
  const enrichedWidgets = useMemo(() => {
    return widgets.map((w) => {
      if (w.type === 'my_issues' && Object.keys(w.config).length === 0) {
        return {
          ...w,
          config: {
            ...w.config,
            _statCard: true,
            _icon: 'assignment',
            _value: '--',
            _color: '#2196f3',
          },
        }
      }
      if (w.type === 'overdue' && Object.keys(w.config).length === 0) {
        return {
          ...w,
          config: {
            ...w.config,
            _statCard: true,
            _icon: 'warning',
            _value: '--',
            _color: '#f44336',
          },
        }
      }
      return w
    })
  }, [widgets])

  // ---------- Render ----------

  if (isLoading) {
    return (
      <div className="w-full py-8 px-6">
        <div className="skeleton-shimmer h-10 w-48 rounded mb-4" />
        <div className="flex gap-4 mt-4">
          <div className="skeleton-shimmer w-[200px] h-[160px] rounded-[--radius-md]" />
          <div className="skeleton-shimmer w-[160px] h-[160px] rounded-[--radius-md]" />
          <div className="skeleton-shimmer w-[40%] h-[300px] rounded-[--radius-md]" />
          <div className="skeleton-shimmer w-[25%] h-[240px] rounded-[--radius-md]" />
        </div>
      </div>
    )
  }

  if (error) {
    // If 404 or similar, show the default dashboard instead of a hard error
    // so the page is usable even before the user has saved a dashboard.
  }

  return (
    <div className="w-full py-8 px-6" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-text-primary">My Dashboard</h1>

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

      {error && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-[--radius-sm] text-sm mb-2">
          Using default dashboard layout. Customize it by clicking &quot;Edit Dashboard&quot;.
        </div>
      )}

      {/* Quick stat cards for personal widgets that are not chart-based */}
      {!editable && (
        <div className="flex gap-4 mb-6 flex-wrap">
          {enrichedWidgets
            .filter((w) => w.config._statCard)
            .map((w) => (
              <div key={w.id} className="w-[180px]">
                <StatCard
                  title={w.title}
                  value={String(w.config._value ?? '--')}
                  icon={
                    w.config._icon === 'assignment' ? (
                      <ClipboardList className="h-8 w-8" />
                    ) : (
                      <AlertTriangle className="h-8 w-8" />
                    )
                  }
                  color={String(w.config._color ?? '#2196f3')}
                />
              </div>
            ))}
        </div>
      )}

      {/* Dashboard grid */}
      <DashboardGrid
        layout={layout}
        widgets={enrichedWidgets.filter((w) => !w.config._statCard || editable)}
        onLayoutChange={handleLayoutChange}
        editable={editable}
        onRemoveWidget={handleRemoveWidget}
        width={gridWidth}
      />

      {/* Widget picker */}
      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAddWidget={handleAddWidget}
      />
    </div>
  )
}
