import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import {
  useProjectDetail,
  useUpdateProject,
  useUsers,
} from '@/hooks/useProjectSettings'
import type { Project, User } from '@/types/api'

interface GeneralSettingsProps {
  projectId: string
}

const PROJECT_STATUSES: Project['status'][] = ['active', 'paused', 'completed', 'archived']
const RAG_STATUSES: Project['rag_status'][] = ['green', 'amber', 'red', 'none']

const ragColors: Record<string, string> = {
  green: '#4caf50',
  amber: '#ff9800',
  red: '#f44336',
  none: '#9e9e9e',
}

export default function GeneralSettings({ projectId }: GeneralSettingsProps) {
  const { data: project, isLoading, error } = useProjectDetail(projectId)
  const { data: users = [] } = useUsers()
  const updateProject = useUpdateProject()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Project['status']>('active')
  const [ragStatus, setRagStatus] = useState<Project['rag_status']>('none')
  const [leadId, setLeadId] = useState<string | null>(null)

  // Sync local state when project loads
  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description ?? '')
      setStatus(project.status)
      setRagStatus(project.rag_status)
      setLeadId(project.lead_id)
    }
  }, [project])

  const handleBlur = useCallback(
    (field: string, value: unknown) => {
      if (!project) return
      const currentValue = project[field as keyof Project]
      if (value === currentValue) return
      updateProject.mutate({ projectId, body: { [field]: value } as Partial<Project> })
    },
    [project, projectId, updateProject],
  )

  const handleStatusChange = useCallback(
    (value: Project['status']) => {
      setStatus(value)
      updateProject.mutate({ projectId, body: { status: value } })
    },
    [projectId, updateProject],
  )

  const handleRagChange = useCallback(
    (value: Project['rag_status']) => {
      setRagStatus(value)
      updateProject.mutate({ projectId, body: { rag_status: value } })
    },
    [projectId, updateProject],
  )

  const handleLeadChange = useCallback(
    (_event: unknown, user: User | null) => {
      setLeadId(user?.id ?? null)
      updateProject.mutate({ projectId, body: { lead_id: user?.id ?? null } as Partial<Project> })
    },
    [projectId, updateProject],
  )

  if (isLoading) {
    return (
      <Stack spacing={3} sx={{ maxWidth: 600 }}>
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={56} />
      </Stack>
    )
  }

  if (error) {
    return <Alert severity="error">Failed to load project settings.</Alert>
  }

  if (!project) return null

  const selectedLead = users.find((u) => u.id === leadId) ?? null

  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <Typography variant="h6">General Settings</Typography>

      <TextField
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => handleBlur('name', name)}
        fullWidth
      />

      <TextField
        label="Key Prefix"
        value={project.key_prefix}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
        helperText="Project key cannot be changed after creation"
      />

      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => handleBlur('description', description || null)}
        fullWidth
        multiline
        minRows={3}
        maxRows={8}
      />

      <Autocomplete
        options={users}
        getOptionLabel={(u) => u.display_name || u.email}
        value={selectedLead}
        onChange={handleLeadChange}
        renderInput={(params) => <TextField {...params} label="Project Lead" />}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
      />

      <TextField
        select
        label="Status"
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as Project['status'])}
        fullWidth
      >
        {PROJECT_STATUSES.map((s) => (
          <MenuItem key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="RAG Status"
        value={ragStatus}
        onChange={(e) => handleRagChange(e.target.value as Project['rag_status'])}
        fullWidth
      >
        {RAG_STATUSES.map((r) => (
          <MenuItem key={r} value={r}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: ragColors[r],
                }}
              />
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Box>
          </MenuItem>
        ))}
      </TextField>

      {updateProject.isError && (
        <Alert severity="error">Failed to save changes. Please try again.</Alert>
      )}
    </Stack>
  )
}
