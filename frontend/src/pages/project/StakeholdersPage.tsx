import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Slider from '@mui/material/Slider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import { useForm, Controller } from 'react-hook-form'
import StakeholderMatrix from '@/components/stakeholders/StakeholderMatrix'
import {
  useStakeholders,
  useCreateStakeholder,
  useUpdateStakeholder,
} from '@/hooks/useStakeholders'
import type { Stakeholder } from '@/types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StakeholderFormValues {
  name: string
  role: string
  interest_level: number
  influence_level: number
}

// ---------------------------------------------------------------------------
// Create / Edit Dialog
// ---------------------------------------------------------------------------

interface StakeholderDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  existing?: Stakeholder | null
}

function StakeholderDialog({ open, onClose, projectId, existing }: StakeholderDialogProps) {
  const createStakeholder = useCreateStakeholder()
  const updateStakeholder = useUpdateStakeholder()
  const isEdit = !!existing

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StakeholderFormValues>({
    defaultValues: {
      name: existing?.name ?? '',
      role: existing?.role ?? '',
      interest_level: existing?.interest_level ?? 5,
      influence_level: existing?.influence_level ?? 5,
    },
  })

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const onSubmit = useCallback(
    async (values: StakeholderFormValues) => {
      if (isEdit && existing) {
        await updateStakeholder.mutateAsync({
          id: existing.id,
          body: {
            name: values.name,
            role: values.role || null,
            interest_level: values.interest_level,
            influence_level: values.influence_level,
          },
        })
      } else {
        await createStakeholder.mutateAsync({
          project_id: projectId,
          name: values.name,
          role: values.role || null,
          interest_level: values.interest_level,
          influence_level: values.influence_level,
        })
      }
      handleClose()
    },
    [isEdit, existing, createStakeholder, updateStakeholder, projectId, handleClose],
  )

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEdit ? 'Edit Stakeholder' : 'Add Stakeholder'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Role" fullWidth />
              )}
            />

            <Box>
              <Typography variant="body2" gutterBottom>
                Interest Level
              </Typography>
              <Controller
                name="interest_level"
                control={control}
                render={({ field }) => (
                  <Slider
                    {...field}
                    onChange={(_e, val) => field.onChange(val)}
                    min={0}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                )}
              />
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom>
                Influence Level
              </Typography>
              <Controller
                name="influence_level"
                control={control}
                render={({ field }) => (
                  <Slider
                    {...field}
                    onChange={(_e, val) => field.onChange(val)}
                    min={0}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                )}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StakeholdersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = projectId ?? ''

  const { data: stakeholders, isLoading, error } = useStakeholders(pid)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null)

  const handleEdit = useCallback((stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder)
    setDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    setEditingStakeholder(null)
  }, [])

  const handleCreate = useCallback(() => {
    setEditingStakeholder(null)
    setDialogOpen(true)
  }, [])

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
        <Typography variant="h4">Stakeholders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Stakeholder
        </Button>
      </Stack>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load stakeholders.
        </Alert>
      )}

      {/* Matrix */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Interest vs Influence Matrix
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <StakeholderMatrix stakeholders={stakeholders ?? []} />
        </Paper>
      </Box>

      {/* Table */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Stakeholder Directory
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="center">Interest</TableCell>
                <TableCell align="center">Influence</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!stakeholders || stakeholders.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No stakeholders yet. Add one to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                stakeholders.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.role ?? '--'}</TableCell>
                    <TableCell align="center">{s.interest_level}</TableCell>
                    <TableCell align="center">{s.influence_level}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(s)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Dialog */}
      <StakeholderDialog
        open={dialogOpen}
        onClose={handleClose}
        projectId={pid}
        existing={editingStakeholder}
      />
    </Container>
  )
}
