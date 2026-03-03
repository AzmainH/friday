import { useState, useMemo } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useProjectStore } from '@/stores/projectStore'
import { formatDate, formatPercent } from '@/utils/formatters'
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useGateApprovals,
  useGateApproval,
  type CreateMilestoneInput,
} from '@/hooks/useMilestones'
import MilestoneTimeline from '@/components/milestones/MilestoneTimeline'
import GateApprovalCard from '@/components/milestones/GateApprovalCard'

// ---- Status config ----

const MILESTONE_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked'] as const
const MILESTONE_TYPES = ['milestone', 'gate', 'phase', 'deliverable'] as const

const STATUS_COLORS: Record<string, string> = {
  not_started: '#9e9e9e',
  in_progress: '#2196f3',
  completed: '#4caf50',
  blocked: '#f44336',
}

// ---- Gate Approvals sub-component ----

function GateApprovalsSection({ milestoneId }: { milestoneId: string }) {
  const { data, isLoading } = useGateApprovals(milestoneId)
  const { decideApproval } = useGateApproval()

  const handleDecide = (approvalId: string, decision: 'approved' | 'rejected') => {
    decideApproval.mutate({ approval_id: approvalId, decision })
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={60} />
      </Box>
    )
  }

  const approvals = data?.data ?? []

  if (approvals.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No gate approvals for this milestone.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Gate Approvals
      </Typography>
      {approvals.map((approval) => (
        <GateApprovalCard
          key={approval.id}
          approval={approval}
          onDecide={handleDecide}
        />
      ))}
    </Box>
  )
}

// ---- Empty form state ----

const EMPTY_FORM: CreateMilestoneInput = {
  name: '',
  description: '',
  milestone_type: 'milestone',
  status: 'not_started',
  start_date: null,
  due_date: null,
}

// ---- Main component ----

export default function MilestonesPage() {
  const project = useProjectStore((s) => s.currentProject)
  const projectId = project?.id ?? ''

  const { data, isLoading, isError } = useMilestones(projectId)
  const createMutation = useCreateMilestone(projectId)
  const updateMutation = useUpdateMilestone(projectId)
  const deleteMutation = useDeleteMilestone(projectId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateMilestoneInput>(EMPTY_FORM)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const milestones = useMemo(() => data?.data ?? [], [data])

  // ---- Dialog handlers ----

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEditDialog = (m: (typeof milestones)[number]) => {
    setEditingId(m.id)
    setForm({
      name: m.name,
      description: m.description ?? '',
      milestone_type: m.milestone_type,
      status: m.status,
      start_date: m.start_date,
      due_date: m.due_date,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, body: form },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createMutation.mutate(form, {
        onSuccess: () => setDialogOpen(false),
      })
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // ---- Field updater ----

  const updateField = (field: keyof CreateMilestoneInput, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ---- Render ----

  if (!projectId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Select a project to view milestones.</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Milestones</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          New Milestone
        </Button>
      </Box>

      {/* Error state */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load milestones. Please try again.
        </Alert>
      )}

      {/* Timeline */}
      <Paper sx={{ mb: 3, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          Timeline
        </Typography>
        {isLoading ? (
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        ) : (
          <MilestoneTimeline milestones={milestones} />
        )}
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Due</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <>
                {[1, 2, 3].map((n) => (
                  <TableRow key={n}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableCell key={i}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}

            {!isLoading && milestones.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No milestones found. Click "New Milestone" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {milestones.map((m) => {
              const isExpanded = expandedId === m.id
              const statusColor = STATUS_COLORS[m.status] ?? '#9e9e9e'

              return (
                <Box component="tbody" key={m.id}>
                  <TableRow
                    hover
                    sx={{ '& > *': { borderBottom: isExpanded ? 'none' : undefined } }}
                  >
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleExpand(m.id)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {m.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={m.milestone_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: `${statusColor}20`,
                          color: statusColor,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(m.start_date)}</TableCell>
                    <TableCell>{formatDate(m.due_date)}</TableCell>
                    <TableCell>{formatPercent(m.progress_pct)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditDialog(m)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(m.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expanded gate approvals */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0 }}>
                      <Collapse in={isExpanded} unmountOnExit>
                        <Box sx={{ bgcolor: 'action.hover' }}>
                          <GateApprovalsSection milestoneId={m.id} />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Box>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Milestone' : 'Create Milestone'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Description"
            value={form.description ?? ''}
            onChange={(e) => updateField('description', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label="Type"
            value={form.milestone_type}
            onChange={(e) => updateField('milestone_type', e.target.value)}
            select
            fullWidth
          >
            {MILESTONE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Status"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            select
            fullWidth
          >
            {MILESTONE_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={form.start_date ?? ''}
              onChange={(e) => updateField('start_date', e.target.value || null)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Due Date"
              type="date"
              value={form.due_date ?? ''}
              onChange={(e) => updateField('due_date', e.target.value || null)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !form.name.trim() ||
              createMutation.isPending ||
              updateMutation.isPending
            }
            startIcon={
              (createMutation.isPending || updateMutation.isPending) ? (
                <CircularProgress size={16} />
              ) : undefined
            }
          >
            {editingId ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
