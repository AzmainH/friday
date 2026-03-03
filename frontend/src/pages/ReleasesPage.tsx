import { useState, useMemo } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Collapse from '@mui/material/Collapse'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { useReleases, useCreateRelease } from '@/hooks/usePortfolio'
import type { ReleaseWithProjects } from '@/hooks/usePortfolio'
import { formatDate } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WORKSPACE_ID = 'default' // Placeholder until workspace context is wired

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'info' | 'error'> = {
  planned: 'info',
  in_progress: 'warning',
  released: 'success',
  cancelled: 'error',
}

const STATUS_OPTIONS = ['planned', 'in_progress', 'released', 'cancelled']

/* ------------------------------------------------------------------ */
/*  Release timeline SVG                                               */
/* ------------------------------------------------------------------ */

function ReleaseTimeline({ releases }: { releases: ReleaseWithProjects[] }) {
  const dated = releases
    .filter((r) => r.release_date)
    .sort(
      (a, b) =>
        new Date(a.release_date!).getTime() - new Date(b.release_date!).getTime(),
    )

  if (dated.length === 0) return null

  const minDate = new Date(dated[0].release_date!)
  const maxDate = new Date(dated[dated.length - 1].release_date!)
  const rangeMs = maxDate.getTime() - minDate.getTime() || 86_400_000

  const SVG_WIDTH = 800
  const SVG_HEIGHT = 80
  const PADDING = 40

  const dateToX = (d: string) => {
    const t = new Date(d).getTime()
    return PADDING + ((t - minDate.getTime()) / rangeMs) * (SVG_WIDTH - PADDING * 2)
  }

  return (
    <Box
      sx={{
        overflowX: 'auto',
        mb: 3,
        p: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Release Timeline
      </Typography>
      <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ display: 'block' }}>
        {/* Baseline */}
        <line
          x1={PADDING}
          y1={40}
          x2={SVG_WIDTH - PADDING}
          y2={40}
          stroke="#bdbdbd"
          strokeWidth={2}
        />

        {/* Today marker */}
        {(() => {
          const now = new Date()
          if (now >= minDate && now <= maxDate) {
            const x = dateToX(now.toISOString())
            return (
              <g>
                <line x1={x} y1={20} x2={x} y2={60} stroke="#1976d2" strokeWidth={2} strokeDasharray="3 2" />
                <text x={x} y={16} textAnchor="middle" fontSize={9} fill="#1976d2">
                  Today
                </text>
              </g>
            )
          }
          return null
        })()}

        {/* Release markers */}
        {dated.map((r) => {
          const x = dateToX(r.release_date!)
          const isReleased = r.status === 'released'
          return (
            <g key={r.id}>
              <circle
                cx={x}
                cy={40}
                r={8}
                fill={isReleased ? '#4caf50' : '#ff9800'}
                stroke="#fff"
                strokeWidth={2}
              />
              <text
                x={x}
                y={66}
                textAnchor="middle"
                fontSize={10}
                fill="var(--mui-palette-text-secondary, #666)"
              >
                {r.name}
              </text>
              <text
                x={x}
                y={26}
                textAnchor="middle"
                fontSize={9}
                fill="var(--mui-palette-text-secondary, #999)"
              >
                {formatDate(r.release_date)}
              </text>
            </g>
          )
        })}
      </svg>
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  Release card                                                       */
/* ------------------------------------------------------------------ */

function ReleaseCard({ release }: { release: ReleaseWithProjects }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: expanded ? 1 : '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RocketLaunchIcon color="action" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {release.name}
            </Typography>
            {release.description && (
              <Typography variant="body2" color="text.secondary">
                {release.description}
              </Typography>
            )}
          </Box>
          <Chip
            label={release.status.replace('_', ' ')}
            size="small"
            color={STATUS_COLOR[release.status] ?? 'default'}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90, textAlign: 'right' }}>
            {formatDate(release.release_date)}
          </Typography>
          <IconButton size="small" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </CardContent>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {release.projects.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No projects linked to this release.
            </Typography>
          ) : (
            <List dense disablePadding>
              {release.projects.map((p) => (
                <ListItem key={p.project_id} disableGutters>
                  <ListItemText primary={p.project_name} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Collapse>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ReleasesPage() {
  const { data: releases, isLoading, error } = useReleases(WORKSPACE_ID)
  const createRelease = useCreateRelease()

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'planned',
    release_date: '',
  })

  const sortedReleases = useMemo(() => {
    if (!releases) return []
    return [...releases].sort((a, b) => {
      if (!a.release_date) return 1
      if (!b.release_date) return -1
      return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    })
  }, [releases])

  const handleCreate = () => {
    createRelease.mutate(
      {
        workspace_id: WORKSPACE_ID,
        name: form.name,
        description: form.description || null,
        status: form.status,
        release_date: form.release_date || null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setForm({ name: '', description: '', status: 'planned', release_date: '' })
        },
      },
    )
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 1, mb: 1 }} />
        ))}
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load releases: {error.message}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Releases
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          New Release
        </Button>
      </Box>

      {/* Timeline visualization */}
      {sortedReleases.length > 0 && <ReleaseTimeline releases={sortedReleases} />}

      {/* Release list */}
      {sortedReleases.length === 0 && (
        <Box
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No releases yet. Create one to start tracking deliveries.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Create Your First Release
          </Button>
        </Box>
      )}

      {sortedReleases.map((release) => (
        <ReleaseCard key={release.id} release={release} />
      ))}

      {/* ---- Create Release Dialog ---- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Release</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s.replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                type="date"
                label="Release Date"
                value={form.release_date}
                onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.name.trim() || createRelease.isPending}
          >
            {createRelease.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
