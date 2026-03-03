import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import AddIcon from '@mui/icons-material/Add'
import FilterListIcon from '@mui/icons-material/FilterList'
import RoadmapGantt from '@/components/roadmap/RoadmapGantt'
import ScenarioPanel from '@/components/roadmap/ScenarioPanel'
import {
  useRoadmapDetail,
  useRoadmapTimeline,
  useAddProjectToRoadmap,
} from '@/hooks/useRoadmap'
import type { RoadmapScenario } from '@/hooks/useRoadmap'
import { formatDate } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RoadmapDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const { data: plan, isLoading: planLoading, error: planError } = useRoadmapDetail(planId)
  const { data: timeline, isLoading: timelineLoading } = useRoadmapTimeline(planId)
  const addProject = useAddProjectToRoadmap()

  // Sidebar state
  const [scenarioPanelOpen, setScenarioPanelOpen] = useState(true)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)

  // Filter state
  const [filterProjectId, setFilterProjectId] = useState<string>('all')

  // Add project dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newProjectId, setNewProjectId] = useState('')

  // Mock scenarios until backend wires up scenario endpoints
  const scenarios: RoadmapScenario[] = useMemo(
    () => [
      {
        id: 'baseline',
        plan_id: planId ?? '',
        name: 'Baseline',
        is_baseline: true,
        overrides: [],
        created_at: new Date().toISOString(),
      },
    ],
    [planId],
  )

  const filteredTimeline = useMemo(() => {
    if (!timeline) return []
    if (filterProjectId === 'all') return timeline.projects
    return timeline.projects.filter((p) => p.id === filterProjectId)
  }, [timeline, filterProjectId])

  const handleAddProject = () => {
    if (planId && newProjectId.trim()) {
      addProject.mutate({ plan_id: planId, project_id: newProjectId.trim() })
    }
    setNewProjectId('')
    setAddDialogOpen(false)
  }

  /* ---- Loading / Error states ---- */
  if (planLoading || timelineLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (planError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load roadmap: {planError.message}</Alert>
      </Container>
    )
  }

  if (!plan) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Roadmap not found.</Alert>
      </Container>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top toolbar */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h5" fontWeight={700}>
              {plan.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(plan.start_date)} &mdash; {formatDate(plan.end_date)}
              {plan.description && ` | ${plan.description}`}
            </Typography>
          </Box>

          {/* Project count chip */}
          <Chip
            label={`${timeline?.projects.length ?? 0} projects`}
            size="small"
            variant="outlined"
          />

          {/* Filter by project */}
          <TextField
            select
            size="small"
            label="Filter project"
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            sx={{ minWidth: 180 }}
            slotProps={{
              input: {
                startAdornment: <FilterListIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
              },
            }}
          >
            <MenuItem value="all">All Projects</MenuItem>
            {(timeline?.projects ?? []).map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Add project button */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Project
          </Button>

          {/* Toggle scenario panel */}
          <IconButton
            size="small"
            onClick={() => setScenarioPanelOpen((o) => !o)}
            aria-label={scenarioPanelOpen ? 'Close scenarios' : 'Open scenarios'}
          >
            {scenarioPanelOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>

        {/* Gantt chart */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <RoadmapGantt timelineData={filteredTimeline} />
        </Box>
      </Box>

      {/* Collapsible right sidebar */}
      {scenarioPanelOpen && (
        <ScenarioPanel
          planId={planId ?? ''}
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={setSelectedScenarioId}
        />
      )}

      {/* ---- Add Project Dialog ---- */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Project to Roadmap</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Project ID"
            placeholder="Enter a project ID"
            value={newProjectId}
            onChange={(e) => setNewProjectId(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddProject}
            disabled={!newProjectId.trim() || addProject.isPending}
          >
            {addProject.isPending ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
