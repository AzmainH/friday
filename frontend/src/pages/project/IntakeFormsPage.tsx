import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import DescriptionIcon from '@mui/icons-material/Description'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import {
  useIntakeForms,
  useCreateForm,
  useUpdateForm,
  useFormSubmissions,
  useReviewSubmission,
  type FormField,
  type IntakeForm,
  type FormSubmission,
} from '@/hooks/useIntakeForms'
import FormBuilder from '@/components/intake/FormBuilder'
import { formatDateTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IntakeFormsPageProps {
  projectId: string
}

// ---------------------------------------------------------------------------
// Submissions sub-component
// ---------------------------------------------------------------------------

function SubmissionsTable({ formId }: { formId: string }) {
  const { data: submissions, isLoading } = useFormSubmissions(formId)
  const reviewMutation = useReviewSubmission()

  const handleReview = useCallback(
    (submissionId: string, decision: 'approved' | 'rejected') => {
      reviewMutation.mutate({ submissionId, body: { decision } })
    },
    [reviewMutation],
  )

  if (isLoading) {
    return (
      <Box sx={{ py: 2 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 0.5, borderRadius: 1 }} />
        ))}
      </Box>
    )
  }

  const items = submissions ?? []

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No submissions yet.
      </Typography>
    )
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Submitted</TableCell>
            <TableCell>Name / Email</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((sub: FormSubmission) => (
            <TableRow key={sub.id} hover>
              <TableCell>{formatDateTime(sub.created_at)}</TableCell>
              <TableCell>
                {sub.submitted_by_name ?? sub.submitted_by_email ?? 'Anonymous'}
              </TableCell>
              <TableCell>
                <Chip
                  label={sub.status}
                  size="small"
                  color={
                    sub.status === 'approved'
                      ? 'success'
                      : sub.status === 'rejected'
                        ? 'error'
                        : 'warning'
                  }
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {sub.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Approve">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleReview(sub.id, 'approved')}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleReview(sub.id, 'rejected')}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function IntakeFormsPage({ projectId }: IntakeFormsPageProps) {
  const { data: forms, isLoading } = useIntakeForms(projectId)
  const createMutation = useCreateForm(projectId)
  const updateMutation = useUpdateForm(projectId)

  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [editingForm, setEditingForm] = useState<IntakeForm | null>(null)
  const [editFields, setEditFields] = useState<FormField[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0) // 0 = forms list, 1 = submissions
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCreate = useCallback(() => {
    if (!createName.trim()) return
    createMutation.mutate(
      {
        name: createName.trim(),
        description: createDesc.trim() || null,
        fields_schema: [],
      },
      {
        onSuccess: () => {
          setShowCreate(false)
          setCreateName('')
          setCreateDesc('')
        },
      },
    )
  }, [createName, createDesc, createMutation])

  const handleStartEdit = useCallback((form: IntakeForm) => {
    setEditingForm(form)
    setEditFields(form.fields_schema)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!editingForm) return
    updateMutation.mutate(
      { id: editingForm.id, body: { fields_schema: editFields } },
      { onSuccess: () => setEditingForm(null) },
    )
  }, [editingForm, editFields, updateMutation])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DescriptionIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Intake Forms
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreate(true)}
        >
          New Form
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab label="Forms" />
        <Tab label="Submissions" disabled={!selectedFormId} />
      </Tabs>

      {/* Forms list tab */}
      {activeTab === 0 && (
        <>
          {isLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          )}

          {!isLoading && forms?.length === 0 && (
            <Box
              sx={{
                p: 6,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No intake forms yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create a form to collect issue requests from external users.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreate(true)}
              >
                Create Form
              </Button>
            </Box>
          )}

          {/* Editing a form */}
          {editingForm && (
            <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Editing: {editingForm.name}
                </Typography>
                <FormBuilder fields={editFields} onChange={setEditFields} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                  <Button variant="outlined" color="inherit" onClick={() => setEditingForm(null)}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSaveEdit}>
                    Save Fields
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Form cards */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {forms?.map((form) => (
              <Card key={form.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {form.name}
                      </Typography>
                      {form.description && (
                        <Typography variant="body2" color="text.secondary">
                          {form.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={form.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={form.is_active ? 'success' : 'default'}
                          variant="outlined"
                        />
                        <Chip
                          label={`${form.fields_schema.length} field${form.fields_schema.length !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    {form.public_url && (
                      <Tooltip title="Copy public URL">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyUrl(form.public_url!)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Edit form fields">
                      <IconButton size="small" onClick={() => handleStartEdit(form)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedFormId(form.id)
                        setActiveTab(1)
                      }}
                    >
                      Submissions
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* Submissions tab */}
      {activeTab === 1 && selectedFormId && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Submissions
            </Typography>
            <SubmissionsTable formId={selectedFormId} />
          </CardContent>
        </Card>
      )}

      {/* Create form dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Intake Form</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Form Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="Description (optional)"
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!createName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy URL snackbar */}
      <Snackbar
        open={copiedUrl}
        autoHideDuration={2000}
        onClose={() => setCopiedUrl(false)}
        message="Public URL copied to clipboard"
      />
    </Container>
  )
}
