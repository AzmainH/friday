import { useCallback, useMemo } from 'react'
import GridLayout, { type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import IssuesByStatusWidget from '@/components/dashboard/IssuesByStatusWidget'
import ProgressDonutWidget from '@/components/dashboard/ProgressDonutWidget'
import MilestoneTimelineWidget from '@/components/dashboard/MilestoneTimelineWidget'
import BurnUpWidget from '@/components/dashboard/BurnUpWidget'
import ActivityFeedWidget from '@/components/dashboard/ActivityFeedWidget'
import WorkloadWidget from '@/components/dashboard/WorkloadWidget'
import type { DashboardLayout, DashboardWidget } from '@/hooks/useDashboard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardGridProps {
  /** Layout array for react-grid-layout. Each item's `i` must match a widget id. */
  layout: DashboardLayout[]
  /** Widget configurations keyed by widget id. */
  widgets: DashboardWidget[]
  /** Called when the user rearranges or resizes widgets. */
  onLayoutChange?: (layout: DashboardLayout[]) => void
  /** When false the grid is locked (no drag/resize). */
  editable?: boolean
  /** Called when a widget is removed (edit mode only). */
  onRemoveWidget?: (widgetId: string) => void
  /** Grid width in px — typically from a container ref. Default 1200. */
  width?: number
}

// ---------------------------------------------------------------------------
// Widget renderer
// ---------------------------------------------------------------------------

function renderWidget(widget: DashboardWidget) {
  const { type, config } = widget

  switch (type) {
    case 'issues_by_status':
      return <IssuesByStatusWidget data={(config.data as { status: string; count: number; color: string }[]) ?? []} />
    case 'progress_donut':
      return (
        <ProgressDonutWidget
          done={(config.done as number) ?? 0}
          inProgress={(config.inProgress as number) ?? 0}
          todo={(config.todo as number) ?? 0}
        />
      )
    case 'milestone_timeline':
      return (
        <MilestoneTimelineWidget
          milestones={
            (config.milestones as {
              id: string
              name: string
              due_date: string | null
              status: string
            }[]) ?? []
          }
        />
      )
    case 'burn_up':
      return <BurnUpWidget data={(config.data as { date: string; total: number; completed: number }[]) ?? []} />
    case 'activity_feed':
      return (
        <ActivityFeedWidget
          activities={
            (config.activities as {
              id: string
              user_name: string
              user_avatar: string | null
              action: string
              created_at: string
            }[]) ?? []
          }
        />
      )
    case 'workload':
      return <WorkloadWidget data={(config.data as { user: string; hours: number; capacity: number }[]) ?? []} />
    default:
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            Unknown widget type: {type}
          </Typography>
        </Box>
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardGrid({
  layout,
  widgets,
  onLayoutChange,
  editable = false,
  onRemoveWidget,
  width = 1200,
}: DashboardGridProps) {
  const widgetMap = useMemo(() => {
    const map = new Map<string, DashboardWidget>()
    for (const w of widgets) {
      map.set(w.id, w)
    }
    return map
  }, [widgets])

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!onLayoutChange) return
      const mapped: DashboardLayout[] = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
      }))
      onLayoutChange(mapped)
    },
    [onLayoutChange],
  )

  const gridLayout: Layout[] = layout.map((l) => ({
    ...l,
    static: !editable,
  }))

  return (
    <Box sx={{ '.react-grid-item.react-grid-placeholder': { bgcolor: 'primary.light', opacity: 0.2, borderRadius: 2 } }}>
      <GridLayout
        className="layout"
        layout={gridLayout}
        cols={12}
        rowHeight={80}
        width={width}
        onLayoutChange={handleLayoutChange}
        isDraggable={editable}
        isResizable={editable}
        draggableHandle=".dashboard-drag-handle"
        compactType="vertical"
        margin={[16, 16]}
      >
        {layout.map((item) => {
          const widget = widgetMap.get(item.i)
          if (!widget) return <div key={item.i} />

          return (
            <div key={item.i}>
              <Paper
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: 2,
                }}
              >
                {/* Widget header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 0.75,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    minHeight: 36,
                  }}
                >
                  {editable && (
                    <DragIndicatorIcon
                      className="dashboard-drag-handle"
                      fontSize="small"
                      sx={{ cursor: 'grab', color: 'text.disabled', mr: 0.5 }}
                    />
                  )}
                  <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }} noWrap>
                    {widget.title}
                  </Typography>
                  {editable && onRemoveWidget && (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveWidget(widget.id)}
                      aria-label={`Remove ${widget.title}`}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {/* Widget body */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
                  {renderWidget(widget)}
                </Box>
              </Paper>
            </div>
          )
        })}
      </GridLayout>
    </Box>
  )
}
