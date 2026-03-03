import { useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import BarChartIcon from '@mui/icons-material/BarChart'
import DonutSmallIcon from '@mui/icons-material/DonutSmall'
import TimelineIcon from '@mui/icons-material/Timeline'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import ListAltIcon from '@mui/icons-material/ListAlt'
import PeopleIcon from '@mui/icons-material/People'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import FlagIcon from '@mui/icons-material/Flag'
import StarIcon from '@mui/icons-material/Star'
import FolderIcon from '@mui/icons-material/Folder'
import type { SvgIconComponent } from '@mui/icons-material'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WidgetTypeDefinition {
  type: string
  label: string
  description: string
  icon: SvgIconComponent
  defaultSize: { w: number; h: number; minW: number; minH: number }
}

export interface WidgetPickerProps {
  open: boolean
  onClose: () => void
  onAddWidget: (widgetType: WidgetTypeDefinition) => void
}

// ---------------------------------------------------------------------------
// Available widget types
// ---------------------------------------------------------------------------

export const WIDGET_TYPES: WidgetTypeDefinition[] = [
  {
    type: 'issues_by_status',
    label: 'Issues by Status',
    description: 'Bar chart showing issue counts grouped by workflow status.',
    icon: BarChartIcon,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
  },
  {
    type: 'progress_donut',
    label: 'Progress Donut',
    description: 'Donut chart showing overall completion percentage.',
    icon: DonutSmallIcon,
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
  },
  {
    type: 'milestone_timeline',
    label: 'Milestone Timeline',
    description: 'Horizontal timeline of upcoming milestones.',
    icon: FlagIcon,
    defaultSize: { w: 6, h: 2, minW: 4, minH: 2 },
  },
  {
    type: 'burn_up',
    label: 'Burn-Up Chart',
    description: 'Line chart tracking total scope versus completed work.',
    icon: ShowChartIcon,
    defaultSize: { w: 6, h: 3, minW: 4, minH: 2 },
  },
  {
    type: 'activity_feed',
    label: 'Activity Feed',
    description: 'Recent activity stream for the project or workspace.',
    icon: ListAltIcon,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 2 },
  },
  {
    type: 'workload',
    label: 'Team Workload',
    description: 'Bar chart or heatmap showing team member workload.',
    icon: PeopleIcon,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
  },
  {
    type: 'my_issues',
    label: 'My Issues',
    description: 'Count of issues assigned to you, grouped by status.',
    icon: AssignmentIcon,
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
  },
  {
    type: 'overdue',
    label: 'Overdue Count',
    description: 'Count of issues past their due date.',
    icon: AccessTimeIcon,
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
  },
  {
    type: 'milestone_timeline',
    label: 'Milestones',
    description: 'Compact timeline of project milestones.',
    icon: TimelineIcon,
    defaultSize: { w: 6, h: 2, minW: 4, minH: 2 },
  },
  {
    type: 'favorites',
    label: 'Favorites',
    description: 'Quick access to your starred items.',
    icon: StarIcon,
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
  },
  {
    type: 'projects_overview',
    label: 'Projects Overview',
    description: 'Summary cards for all projects you are a member of.',
    icon: FolderIcon,
    defaultSize: { w: 6, h: 3, minW: 4, minH: 2 },
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WidgetPicker({ open, onClose, onAddWidget }: WidgetPickerProps) {
  const handleSelect = useCallback(
    (widgetType: WidgetTypeDefinition) => {
      onAddWidget(widgetType)
      onClose()
    },
    [onAddWidget, onClose],
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Add Widget
        <IconButton size="small" onClick={onClose} aria-label="Close widget picker">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {WIDGET_TYPES.map((wt) => {
            const Icon = wt.icon
            return (
              <Grid item xs={12} sm={6} md={4} key={`${wt.type}-${wt.label}`}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelect(wt)}
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', p: 0 }}
                  >
                    <CardContent sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.contrastText',
                          }}
                        >
                          <Icon fontSize="small" />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {wt.label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {wt.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  )
}
