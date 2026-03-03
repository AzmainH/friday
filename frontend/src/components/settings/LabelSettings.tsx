import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  useLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
} from '@/hooks/useProjectSettings'
import type { Label } from '@/types/api'

interface LabelSettingsProps {
  projectId: string
}

const COLOR_PRESETS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
]

interface LabelFormState {
  name: string
  color: string
}

const EMPTY_FORM: LabelFormState = {
  name: '',
  color: '#2196f3',
}

export default function LabelSettings({ projectId }: LabelSettingsProps) {
  const { data: labels = [], isLoading, error } = useLabels(projectId)
  const createLabel = useCreateLabel()
  const updateLabel = useUpdateLabel()
  const deleteLabel = useDeleteLabel()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LabelFormState>(EMPTY_FORM)

  const openCreateDialog = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((label: Label) => {
    setEditingId(label.id)
    setForm({ name: label.name, color: label.color })
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    const body: Partial<Label> = {
      name: form.name,
      color: form.color,
    }

    if (editingId) {
      updateLabel.mutate(
        { labelId: editingId, projectId, body },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createLabel.mutate(
        { projectId, body },
        { onSuccess: () => setDialogOpen(false) },
      )
    }
  }, [editingId, form, projectId, createLabel, updateLabel])

  const handleDelete = useCallback(
    (labelId: string) => {
      deleteLabel.mutate({ labelId, projectId })
    },
    [projectId, deleteLabel],
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
    return <Alert severity="error">Failed to load labels.</Alert>
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Labels</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Add Label
        </Button>
      </Box>

      <Paper variant="outlined">
        <List disablePadding>
          {labels.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No labels defined"
                secondary="Add labels to categorise and filter issues."
                sx={{ textAlign: 'center', py: 3 }}
              />
            </ListItem>
          )}
          {labels.map((label, idx) => (
            <ListItem key={label.id} divider={idx < labels.length - 1} sx={{ py: 1.5 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: label.color,
                  mr: 2,
                  flexShrink: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              <ListItemText
                primary={label.name}
                secondary={label.color}
              />
              <ListItemSecondaryAction>
                <IconButton size="small" onClick={() => openEditDialog(label)} aria-label="Edit label">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(label.id)}
                  aria-label="Delete label"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Label' : 'New Label'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Label Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              autoFocus
            />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {COLOR_PRESETS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: c,
                      cursor: 'pointer',
                      border: form.color === c ? '3px solid' : '2px solid transparent',
                      borderColor: form.color === c ? 'text.primary' : 'transparent',
                      transition: 'border-color 0.2s',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
              </Box>

              {/* Custom color input */}
              <TextField
                label="Custom Color"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 0.5,
                          bgcolor: form.color,
                          mr: 1,
                          flexShrink: 0,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                    ),
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || createLabel.isPending || updateLabel.isPending}
          >
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
