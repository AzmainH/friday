import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import BugReportIcon from '@mui/icons-material/BugReport'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import type { PortfolioProject } from '@/hooks/usePortfolio'
import { RAG_COLORS, formatPercent, formatCurrency } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ProjectCardProps {
  project: PortfolioProject
  onClick?: (projectId: string) => void
}

/* ------------------------------------------------------------------ */
/*  Status label map                                                   */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const ragColor = RAG_COLORS[project.rag_status] ?? RAG_COLORS.none

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.15s',
        '&:hover': onClick
          ? { boxShadow: 6, transform: 'translateY(-2px)' }
          : undefined,
      }}
      onClick={() => onClick?.(project.id)}
    >
      <CardContent sx={{ pb: '16px !important' }}>
        {/* Top row: RAG indicator + name + status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Tooltip title={`RAG: ${project.rag_status}`}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: ragColor,
                flexShrink: 0,
                boxShadow: `0 0 0 2px ${ragColor}33`,
              }}
            />
          </Tooltip>
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1 }}>
            {project.name}
          </Typography>
          <Chip
            label={STATUS_LABELS[project.status] ?? project.status}
            size="small"
            variant="outlined"
            color={
              project.status === 'active'
                ? 'primary'
                : project.status === 'completed'
                  ? 'success'
                  : 'default'
            }
          />
        </Box>

        {/* Progress bar */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {formatPercent(project.progress_pct)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(project.progress_pct, 100)}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: ragColor,
              },
            }}
          />
        </Box>

        {/* Key metrics row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Tooltip title="Total issues">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BugReportIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{project.total_issues}</Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Completed issues">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2">{project.completed_issues}</Typography>
            </Box>
          </Tooltip>
          {project.overdue_issues > 0 && (
            <Tooltip title="Overdue issues">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningAmberIcon sx={{ fontSize: 16, color: 'error.main' }} />
                <Typography variant="body2" color="error.main">
                  {project.overdue_issues}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Budget (if available) */}
        {project.budget_allocated != null && project.budget_allocated > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Budget: {formatCurrency(project.budget_spent ?? 0)} /{' '}
            {formatCurrency(project.budget_allocated)}
          </Typography>
        )}

        {/* Lead avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Avatar
            src={project.lead_avatar_url ?? undefined}
            sx={{ width: 24, height: 24, fontSize: 12 }}
          >
            {project.lead_name ? project.lead_name.charAt(0).toUpperCase() : '?'}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {project.lead_name ?? 'Unassigned'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
