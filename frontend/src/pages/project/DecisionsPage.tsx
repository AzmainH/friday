import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import { useForm, Controller } from 'react-hook-form'
import DecisionDetail from '@/components/decisions/DecisionDetail'
import { useDecisions, useCreateDecision } from '@/hooks/useDecisions'
import type { DecisionDetail as DecisionDetailType } from '@/hooks/useDecisions'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DECISION_STATUSES = ['proposed', 'accepted', 'rejected', 'deferred', 'superseded'] as const

// ---------------------------------------------------------------------------
// Create Decision Dialog
// ---------------------------------------------------------------------------

interface CreateFormValues {
  title: string
  description: string
  status: string
}

interface CreateDecisionDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
}

function CreateDecisionDialog({ open, onClose, projectId }: CreateDecisionDialogProps) {
  const createDecision = useCreateDecision()
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    defaultValues: { title: '', description: '', status: 'proposed' },
  })

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const onSubmit = useCallback(
    async (values: CreateFormValues) => {
      await createDecision.mutateAsync({
        project_id: projectId,
        title: values.title,
        description: values.description || null,
        status: values.status,
      })
      handleClose()
    },
    [createDecision, projectId, handleClose],
  )

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>New Decision</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Title"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Status" fullWidth>
                  {DECISION_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DecisionsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = projectId ?? ''

  const { data: decisions, isLoading, error } = useDecisions(pid)

  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    if (!decisions) return []
    if (statusFilter === 'all') return decisions
    return decisions.filter((d) => d.status === statusFilter)
  }, [decisions, statusFilter])

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Decisions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          New Decision
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {DECISION_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load decisions.
        </Alert>
      )}

      {/* Decision list */}
      {filtered.length === 0 ? (
        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary">
            No decisions found. Create one to get started.
          </Typography>
        </Box>
      ) : (
        filtered.map((decision) => (
          <DecisionDetail
            key={decision.id}
            decision={decision as DecisionDetailType}
          />
        ))
      )}

      {/* Create dialog */}
      <CreateDecisionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={pid}
      />
    </Container>
  )
}
