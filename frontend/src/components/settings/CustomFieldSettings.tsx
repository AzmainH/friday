import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  useCustomFields,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
  type CustomFieldDefinition,
} from '@/hooks/useProjectSettings'

interface CustomFieldSettingsProps {
  projectId: string
}

const FIELD_TYPES: CustomFieldDefinition['field_type'][] = [
  'text',
  'number',
  'date',
  'select',
  'multiselect',
  'checkbox',
  'url',
  'user',
]

const FIELD_TYPE_LABELS: Record<CustomFieldDefinition['field_type'], string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  select: 'Single Select',
  multiselect: 'Multi Select',
  checkbox: 'Checkbox',
  url: 'URL',
  user: 'User',
}

interface FieldFormState {
  name: string
  field_type: CustomFieldDefinition['field_type']
  options: string
  is_required: boolean
}

const EMPTY_FORM: FieldFormState = {
  name: '',
  field_type: 'text',
  options: '',
  is_required: false,
}

export default function CustomFieldSettings({ projectId }: CustomFieldSettingsProps) {
  const { data: fields = [], isLoading, error } = useCustomFields(projectId)
  const createField = useCreateCustomField()
  const updateField = useUpdateCustomField()
  const deleteField = useDeleteCustomField()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FieldFormState>(EMPTY_FORM)

  const hasOptions = form.field_type === 'select' || form.field_type === 'multiselect'

  const openCreateDialog = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((field: CustomFieldDefinition) => {
    setEditingId(field.id)
    setForm({
      name: field.name,
      field_type: field.field_type,
      options: (field.options ?? []).join(', '),
      is_required: field.is_required,
    })
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    const parsedOptions = hasOptions
      ? form.options
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : null

    const body: Partial<CustomFieldDefinition> = {
      name: form.name,
      field_type: form.field_type,
      options: parsedOptions,
      is_required: form.is_required,
    }

    if (editingId) {
      updateField.mutate(
        { fieldId: editingId, projectId, body },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createField.mutate(
        { projectId, body },
        { onSuccess: () => setDialogOpen(false) },
      )
    }
  }, [editingId, form, hasOptions, projectId, createField, updateField])

  const handleDelete = useCallback(
    (fieldId: string) => {
      deleteField.mutate({ fieldId, projectId })
    },
    [projectId, deleteField],
  )

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={200} />
      </Stack>
    )
  }

  if (error) {
    return <Alert severity="error">Failed to load custom fields.</Alert>
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Custom Fields</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Add Field
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Options</TableCell>
              <TableCell align="center" width={100}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No custom fields defined. Add fields to extend your issue tracking.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {field.name}
                    </Typography>
                    {field.is_required && (
                      <Chip label="Required" size="small" color="warning" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={FIELD_TYPE_LABELS[field.field_type]}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {field.options && field.options.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {field.options.slice(0, 5).map((opt) => (
                        <Chip key={opt} label={opt} size="small" />
                      ))}
                      {field.options.length > 5 && (
                        <Chip label={`+${field.options.length - 5} more`} size="small" variant="outlined" />
                      )}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      --
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => openEditDialog(field)} aria-label="Edit field">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(field.id)}
                    aria-label="Delete field"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Custom Field' : 'New Custom Field'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Field Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              autoFocus
            />

            <TextField
              select
              label="Field Type"
              value={form.field_type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  field_type: e.target.value as CustomFieldDefinition['field_type'],
                }))
              }
              fullWidth
            >
              {FIELD_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {FIELD_TYPE_LABELS[t]}
                </MenuItem>
              ))}
            </TextField>

            {hasOptions && (
              <TextField
                label="Options"
                value={form.options}
                onChange={(e) => setForm((prev) => ({ ...prev, options: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
                helperText="Comma-separated list of options (e.g. Low, Medium, High)"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || createField.isPending || updateField.isPending}
          >
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
