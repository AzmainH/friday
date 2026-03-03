import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { useRoadmapPlans, useCreateRoadmap } from '@/hooks/useRoadmap'
import { formatDate } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WORKSPACE_ID = 'default' // Placeholder until workspace context is wired

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RoadmapsPageNew() {
  const navigate = useNavigate()
  const { data: plans, isLoading, error } = useRoadmapPlans(WORKSPACE_ID)
  const createRoadmap = useCreateRoadmap()

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  const handleCreate = () => {
    createRoadmap.mutate(
      {
        workspace_id: WORKSPACE_ID,
        name: form.name,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      },
      {
        onSuccess: (newPlan) => {
          setDialogOpen(false)
          setForm({ name: '', description: '', start_date: '', end_date: '' })
          navigate(`/roadmaps/${newPlan.id}`)
        },
      },
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Roadmaps
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          New Roadmap
        </Button>
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load roadmaps: {error.message}
        </Alert>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }, (_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="70%" height={28} />
                  <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Roadmap cards */}
      {!isLoading && plans && plans.length === 0 && (
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
            No roadmaps yet. Create one to start planning across projects.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Create Your First Roadmap
          </Button>
        </Box>
      )}

      {!isLoading && plans && plans.length > 0 && (
        <Grid container spacing={2}>
          {plans.map((plan) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardActionArea onClick={() => navigate(`/roadmaps/${plan.id}`)}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                      {plan.name}
                    </Typography>

                    {plan.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {plan.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(plan.start_date)} &mdash; {formatDate(plan.end_date)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 1.5 }}>
                      <Chip label="Roadmap" size="small" variant="outlined" color="primary" />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ---- Create Roadmap Dialog ---- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Roadmap</DialogTitle>
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
                fullWidth
                type="date"
                label="Start Date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
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
            disabled={!form.name.trim() || createRoadmap.isPending}
          >
            {createRoadmap.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
