import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SummarizeIcon from '@mui/icons-material/Summarize'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { useTriggerAI, useAITaskStatus, type AITaskType } from '@/hooks/useAI'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIPanelProps {
  projectId: string
}

interface AIAction {
  type: AITaskType
  label: string
  description: string
  icon: React.ReactNode
  color: 'primary' | 'warning' | 'info'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AI_ACTIONS: AIAction[] = [
  {
    type: 'smart_schedule',
    label: 'Smart Schedule',
    description: 'Optimize task scheduling based on priorities, dependencies, and team capacity.',
    icon: <CalendarMonthIcon />,
    color: 'primary',
  },
  {
    type: 'risk_prediction',
    label: 'Risk Prediction',
    description: 'Identify potential risks and bottlenecks in your current sprint or project.',
    icon: <WarningAmberIcon />,
    color: 'warning',
  },
  {
    type: 'project_summary',
    label: 'Project Summary',
    description: 'Generate a comprehensive summary of project status, progress, and key metrics.',
    icon: <SummarizeIcon />,
    color: 'info',
  },
]

// ---------------------------------------------------------------------------
// Result renderers
// ---------------------------------------------------------------------------

function ScheduleResult({ data }: { data: Record<string, unknown> }) {
  const suggestions = (data.suggestions as Array<Record<string, unknown>>) ?? []
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Scheduling Suggestions
      </Typography>
      {suggestions.length > 0 ? (
        <List dense disablePadding>
          {suggestions.map((s, i) => (
            <ListItem key={i} disableGutters>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText
                primary={s.issue_key as string}
                secondary={s.recommendation as string}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {(data.summary as string) ?? 'Schedule looks optimal.'}
        </Typography>
      )}
    </Box>
  )
}

function RiskResult({ data }: { data: Record<string, unknown> }) {
  const risks = (data.risks as Array<Record<string, unknown>>) ?? []
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Identified Risks
      </Typography>
      {risks.length > 0 ? (
        <List dense disablePadding>
          {risks.map((r, i) => (
            <ListItem key={i} disableGutters>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <WarningAmberIcon
                  sx={{
                    fontSize: 16,
                    color:
                      (r.severity as string) === 'high'
                        ? 'error.main'
                        : (r.severity as string) === 'medium'
                          ? 'warning.main'
                          : 'text.secondary',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={r.title as string}
                secondary={r.description as string}
              />
              <Chip
                label={r.severity as string}
                size="small"
                color={
                  (r.severity as string) === 'high'
                    ? 'error'
                    : (r.severity as string) === 'medium'
                      ? 'warning'
                      : 'default'
                }
                variant="outlined"
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {(data.summary as string) ?? 'No significant risks detected.'}
        </Typography>
      )}
    </Box>
  )
}

function SummaryResult({ data }: { data: Record<string, unknown> }) {
  const summary = typeof data.summary === 'string' ? data.summary : null
  const metrics =
    data.metrics && typeof data.metrics === 'object'
      ? (data.metrics as Record<string, unknown>)
      : null

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Project Summary
      </Typography>
      {summary && (
        <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
          {summary}
        </Typography>
      )}
      {metrics && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {Object.entries(metrics).map(([key, val]) => (
            <Chip
              key={key}
              label={`${key.replace(/_/g, ' ')}: ${String(val)}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

function AIResultDisplay({
  taskType,
  data,
}: {
  taskType: AITaskType
  data: Record<string, unknown>
}) {
  switch (taskType) {
    case 'smart_schedule':
      return <ScheduleResult data={data} />
    case 'risk_prediction':
      return <RiskResult data={data} />
    case 'project_summary':
      return <SummaryResult data={data} />
    default:
      return (
        <Typography variant="body2" color="text.secondary">
          {JSON.stringify(data, null, 2)}
        </Typography>
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIPanel({ projectId }: AIPanelProps) {
  const triggerMutation = useTriggerAI()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeTaskType, setActiveTaskType] = useState<AITaskType | null>(null)
  const { status, result, isPolling } = useAITaskStatus(activeTaskId)

  const handleTrigger = useCallback(
    (taskType: AITaskType) => {
      triggerMutation.mutate(
        { project_id: projectId, task_type: taskType },
        {
          onSuccess: (data) => {
            setActiveTaskId(data.task_id)
            setActiveTaskType(taskType)
          },
        },
      )
    },
    [projectId, triggerMutation],
  )

  const handleReset = useCallback(() => {
    setActiveTaskId(null)
    setActiveTaskType(null)
  }, [])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          AI Assistant
        </Typography>
      </Box>

      {/* Action cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {AI_ACTIONS.map((action) => (
          <Card
            key={action.type}
            variant="outlined"
            sx={{
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: `${action.color}.main` },
            }}
            onClick={() => handleTrigger(action.type)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: `${action.color}.main`,
                  color: 'white',
                }}
              >
                {action.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {action.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {action.description}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Loading / results area */}
      {(isPolling || result) && (
        <>
          <Divider sx={{ mb: 2 }} />

          {isPolling && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3, justifyContent: 'center' }}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                {status === 'pending'
                  ? 'Queued, waiting to start...'
                  : 'Analyzing your project...'}
              </Typography>
            </Box>
          )}

          {!isPolling && result && (
            <Box>
              {result.status === 'failed' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {result.error ?? 'AI task failed. Please try again.'}
                </Alert>
              )}

              {result.status === 'completed' && result.result && activeTaskType && (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <AIResultDisplay taskType={activeTaskType} data={result.result} />
                  </CardContent>
                </Card>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button size="small" onClick={handleReset}>
                  Clear Results
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
