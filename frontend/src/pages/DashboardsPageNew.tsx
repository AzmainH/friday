import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import AssignmentIcon from '@mui/icons-material/Assignment'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
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
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 2,
        borderRadius: 2,
      }}
    >
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="h3" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Paper>
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
      <Container maxWidth={false} sx={{ py: 4, px: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Skeleton variant="rounded" width={200} height={160} />
          <Skeleton variant="rounded" width={160} height={160} />
          <Skeleton variant="rounded" width="40%" height={300} />
          <Skeleton variant="rounded" width="25%" height={240} />
        </Box>
      </Container>
    )
  }

  if (error) {
    // If 404 or similar, show the default dashboard instead of a hard error
    // so the page is usable even before the user has saved a dashboard.
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
          My Dashboard
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

      {error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Using default dashboard layout. Customize it by clicking "Edit Dashboard".
        </Alert>
      )}

      {/* Quick stat cards for personal widgets that are not chart-based */}
      {!editable && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {enrichedWidgets
            .filter((w) => w.config._statCard)
            .map((w) => (
              <Box key={w.id} sx={{ width: 180 }}>
                <StatCard
                  title={w.title}
                  value={String(w.config._value ?? '--')}
                  icon={
                    w.config._icon === 'assignment' ? (
                      <AssignmentIcon sx={{ fontSize: 32 }} />
                    ) : (
                      <WarningAmberIcon sx={{ fontSize: 32 }} />
                    )
                  }
                  color={String(w.config._color ?? '#2196f3')}
                />
              </Box>
            ))}
        </Box>
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
    </Container>
  )
}
