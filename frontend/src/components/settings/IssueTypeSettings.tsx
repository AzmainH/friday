import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BugReportIcon from '@mui/icons-material/BugReport'
import TaskIcon from '@mui/icons-material/Task'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import {
  useIssueTypes,
  useCreateIssueType,
  useUpdateIssueType,
  useDeleteIssueType,
} from '@/hooks/useProjectSettings'
import type { IssueType } from '@/types/api'

interface IssueTypeSettingsProps {
  projectId: string
}

const ICON_OPTIONS = [
  { value: 'bug', label: 'Bug', component: BugReportIcon },
  { value: 'task', label: 'Task', component: TaskIcon },
  { value: 'story', label: 'Story', component: BookmarkIcon },
]

const COLOR_OPTIONS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#ff9800',
]

interface IssueTypeFormState {
  name: string
  icon: string
  color: string
  is_subtask: boolean
}

const EMPTY_FORM: IssueTypeFormState = {
  name: '',
  icon: 'task',
  color: '#2196f3',
  is_subtask: false,
}

function getIconComponent(icon: string | null) {
  const match = ICON_OPTIONS.find((o) => o.value === icon)
  if (match) {
    const Icon = match.component
    return <Icon />
  }
  return <TaskIcon />
}

export default function IssueTypeSettings({ projectId }: IssueTypeSettingsProps) {
  const { data: issueTypes = [], isLoading, error } = useIssueTypes(projectId)
  const createIssueType = useCreateIssueType()
  const updateIssueType = useUpdateIssueType()
  const deleteIssueType = useDeleteIssueType()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<IssueTypeFormState>(EMPTY_FORM)

  const openCreateDialog = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((it: IssueType) => {
    setEditingId(it.id)
    setForm({
      name: it.name,
      icon: it.icon ?? 'task',
      color: it.color ?? '#2196f3',
      is_subtask: it.is_subtask,
    })
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    const body: Partial<IssueType> = {
      name: form.name,
      icon: form.icon,
      color: form.color,
      is_subtask: form.is_subtask,
    }

    if (editingId) {
      updateIssueType.mutate(
        { issueTypeId: editingId, projectId, body },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createIssueType.mutate(
        { projectId, body },
        { onSuccess: () => setDialogOpen(false) },
      )
    }
  }, [editingId, form, projectId, createIssueType, updateIssueType])

  const handleDelete = useCallback(
    (issueTypeId: string) => {
      deleteIssueType.mutate({ issueTypeId, projectId })
    },
    [projectId, deleteIssueType],
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
    return <Alert severity="error">Failed to load issue types.</Alert>
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Issue Types</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Add Issue Type
        </Button>
      </Box>

      <Paper variant="outlined">
        <List disablePadding>
          {issueTypes.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No issue types defined"
                secondary="Add issue types like Bug, Task, Story to categorise your work."
                sx={{ textAlign: 'center', py: 3 }}
              />
            </ListItem>
          )}
          {issueTypes.map((it, idx) => (
            <ListItem
              key={it.id}
              divider={idx < issueTypes.length - 1}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon sx={{ color: it.color ?? 'inherit', minWidth: 40 }}>
                {getIconComponent(it.icon)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {it.name}
                    {it.is_subtask && (
                      <Chip label="Subtask" size="small" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: it.color ?? '#9e9e9e',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {it.color ?? 'No color'}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton size="small" onClick={() => openEditDialog(it)} aria-label="Edit issue type">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(it.id)}
                  aria-label="Delete issue type"
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
        <DialogTitle>{editingId ? 'Edit Issue Type' : 'New Issue Type'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              autoFocus
            />

            <TextField
              select
              label="Icon"
              value={form.icon}
              onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
              fullWidth
            >
              {ICON_OPTIONS.map((opt) => {
                const Icon = opt.component
                return (
                  <Box
                    component="li"
                    key={opt.value}
                    value={opt.value}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    // TextField select uses MenuItem children internally
                  >
                    {/* Render as MenuItem content */}
                    <Icon fontSize="small" /> {opt.label}
                  </Box>
                )
              })}
            </TextField>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {COLOR_OPTIONS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      border: form.color === c ? '3px solid' : '2px solid transparent',
                      borderColor: form.color === c ? 'primary.main' : 'transparent',
                      transition: 'border-color 0.2s',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_subtask}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_subtask: e.target.checked }))}
                />
              }
              label="Is Subtask Type"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || createIssueType.isPending || updateIssueType.isPending}
          >
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
