import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BugReportIcon from '@mui/icons-material/BugReport'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FolderIcon from '@mui/icons-material/Folder'
import GroupIcon from '@mui/icons-material/Group'
import LabelIcon from '@mui/icons-material/Label'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import client from '@/api/client'
import { useUsers } from '@/hooks/useProjectSettings'
import { useOrgStore } from '@/stores/orgStore'
import type { User } from '@/types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Template {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  defaultWorkflow: { name: string; category: string; color: string }[]
  defaultLabels: { name: string; color: string }[]
}

interface TeamMember {
  user: User
  role: 'admin' | 'member' | 'viewer'
}

interface WizardState {
  templateId: string | null
  name: string
  keyPrefix: string
  description: string
  workspaceId: string
  lead: User | null
  members: TeamMember[]
  labels: { name: string; color: string }[]
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const TEMPLATES: Template[] = [
  {
    id: 'scrum',
    name: 'Scrum',
    description: 'Agile sprints with stories, tasks, and bugs. Includes a Kanban board and backlog.',
    icon: <ViewKanbanIcon sx={{ fontSize: 40 }} />,
    defaultWorkflow: [
      { name: 'Backlog', category: 'todo', color: '#78909c' },
      { name: 'To Do', category: 'todo', color: '#42a5f5' },
      { name: 'In Progress', category: 'in_progress', color: '#ffa726' },
      { name: 'In Review', category: 'in_progress', color: '#ab47bc' },
      { name: 'Done', category: 'done', color: '#66bb6a' },
    ],
    defaultLabels: [
      { name: 'Feature', color: '#2196f3' },
      { name: 'Bug', color: '#f44336' },
      { name: 'Improvement', color: '#ff9800' },
      { name: 'Tech Debt', color: '#9c27b0' },
    ],
  },
  {
    id: 'kanban',
    name: 'Kanban',
    description: 'Continuous flow with WIP limits. Great for support teams and ongoing delivery.',
    icon: <DashboardIcon sx={{ fontSize: 40 }} />,
    defaultWorkflow: [
      { name: 'To Do', category: 'todo', color: '#42a5f5' },
      { name: 'In Progress', category: 'in_progress', color: '#ffa726' },
      { name: 'Done', category: 'done', color: '#66bb6a' },
    ],
    defaultLabels: [
      { name: 'Urgent', color: '#f44336' },
      { name: 'Normal', color: '#2196f3' },
      { name: 'Low', color: '#4caf50' },
    ],
  },
  {
    id: 'bug-tracking',
    name: 'Bug Tracking',
    description: 'Focused on defect management with triage, investigation, and resolution stages.',
    icon: <BugReportIcon sx={{ fontSize: 40 }} />,
    defaultWorkflow: [
      { name: 'New', category: 'todo', color: '#42a5f5' },
      { name: 'Triaged', category: 'todo', color: '#26c6da' },
      { name: 'Investigating', category: 'in_progress', color: '#ffa726' },
      { name: 'Fixing', category: 'in_progress', color: '#ff7043' },
      { name: 'Verified', category: 'done', color: '#66bb6a' },
      { name: 'Closed', category: 'done', color: '#78909c' },
    ],
    defaultLabels: [
      { name: 'Critical', color: '#f44336' },
      { name: 'Major', color: '#ff9800' },
      { name: 'Minor', color: '#ffc107' },
      { name: 'Cosmetic', color: '#9e9e9e' },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with a minimal workflow. Configure everything yourself.',
    icon: <RocketLaunchIcon sx={{ fontSize: 40 }} />,
    defaultWorkflow: [
      { name: 'To Do', category: 'todo', color: '#42a5f5' },
      { name: 'In Progress', category: 'in_progress', color: '#ffa726' },
      { name: 'Done', category: 'done', color: '#66bb6a' },
    ],
    defaultLabels: [],
  },
]

const STEPS = [
  'Template',
  'Basic Info',
  'Team',
  'Configuration',
  'Review & Create',
]

// ---------------------------------------------------------------------------
// Auto key prefix from name
// ---------------------------------------------------------------------------

function generateKeyPrefix(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 5)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectCreationWizard() {
  const navigate = useNavigate()
  const currentWorkspaceId = useOrgStore((s) => s.currentWorkspaceId)
  const { data: users = [] } = useUsers()

  const [activeStep, setActiveStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [state, setState] = useState<WizardState>({
    templateId: null,
    name: '',
    keyPrefix: '',
    description: '',
    workspaceId: currentWorkspaceId ?? '',
    lead: null,
    members: [],
    labels: [],
  })

  const selectedTemplate = TEMPLATES.find((t) => t.id === state.templateId) ?? null

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  const canAdvance = useCallback((): boolean => {
    switch (activeStep) {
      case 0:
        return !!state.templateId
      case 1:
        return !!state.name.trim() && !!state.keyPrefix.trim()
      case 2:
        return true // team is optional
      case 3:
        return true // config is optional
      case 4:
        return true
      default:
        return false
    }
  }, [activeStep, state])

  const handleNext = useCallback(() => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1)
    }
  }, [activeStep])

  const handleBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1)
    }
  }, [activeStep])

  // ---------------------------------------------------------------------------
  // Template selection
  // ---------------------------------------------------------------------------

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId)
    setState((prev) => ({
      ...prev,
      templateId,
      labels: template?.defaultLabels ?? [],
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // Team management
  // ---------------------------------------------------------------------------

  const handleAddMember = useCallback((_event: unknown, user: User | null) => {
    if (!user) return
    setState((prev) => {
      if (prev.members.some((m) => m.user.id === user.id)) return prev
      return { ...prev, members: [...prev.members, { user, role: 'member' }] }
    })
  }, [])

  const handleRemoveMember = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.user.id !== userId),
    }))
  }, [])

  const handleMemberRoleChange = useCallback((userId: string, role: TeamMember['role']) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.user.id === userId ? { ...m, role } : m,
      ),
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // Label management
  // ---------------------------------------------------------------------------

  const handleRemoveLabel = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      labels: prev.labels.filter((_, i) => i !== index),
    }))
  }, [])

  const handleAddLabel = useCallback((name: string, color: string) => {
    setState((prev) => ({
      ...prev,
      labels: [...prev.labels, { name, color }],
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // Create project
  // ---------------------------------------------------------------------------

  const handleCreate = useCallback(async () => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        template_id: state.templateId,
        name: state.name,
        key_prefix: state.keyPrefix,
        description: state.description || null,
        workspace_id: state.workspaceId || undefined,
        lead_id: state.lead?.id ?? null,
        members: state.members.map((m) => ({
          user_id: m.user.id,
          role: m.role,
        })),
        labels: state.labels,
        workflow_statuses: selectedTemplate?.defaultWorkflow ?? [],
      }

      const { data } = await client.post('/wizard/create-project', payload)
      const projectId = data.id ?? data.project_id
      navigate(`/projects/${projectId}`)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create project. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }, [state, selectedTemplate, navigate])

  // ---------------------------------------------------------------------------
  // Render steps
  // ---------------------------------------------------------------------------

  function renderTemplateStep() {
    return (
      <Stack spacing={3}>
        <Typography variant="h6">Choose a Template</Typography>
        <Typography variant="body2" color="text.secondary">
          Select a project template to start with pre-configured workflows and settings.
        </Typography>
        <Grid container spacing={2}>
          {TEMPLATES.map((template) => (
            <Grid key={template.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  border: state.templateId === template.id ? '2px solid' : '1px solid',
                  borderColor: state.templateId === template.id ? 'primary.main' : 'divider',
                  transition: 'border-color 0.2s',
                }}
              >
                <CardActionArea
                  onClick={() => handleTemplateSelect(template.id)}
                  sx={{ height: '100%', p: 0 }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: state.templateId === template.id ? 'primary.main' : 'text.secondary', mb: 1.5 }}>
                      {template.icon}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                    {state.templateId === template.id && (
                      <CheckCircleIcon
                        color="primary"
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    )
  }

  function renderBasicInfoStep() {
    return (
      <Stack spacing={3} sx={{ maxWidth: 600 }}>
        <Typography variant="h6">Basic Information</Typography>

        <TextField
          label="Project Name"
          value={state.name}
          onChange={(e) => {
            const name = e.target.value
            setState((prev) => ({
              ...prev,
              name,
              keyPrefix: prev.keyPrefix || generateKeyPrefix(name),
            }))
          }}
          fullWidth
          autoFocus
          required
        />

        <TextField
          label="Key Prefix"
          value={state.keyPrefix}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              keyPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            }))
          }
          fullWidth
          required
          helperText="Used for issue keys (e.g. PROJ-123). Max 5 characters."
          slotProps={{ input: { inputProps: { maxLength: 5 } } }}
        />

        <TextField
          label="Description"
          value={state.description}
          onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
        />

        <TextField
          label="Workspace ID"
          value={state.workspaceId}
          onChange={(e) => setState((prev) => ({ ...prev, workspaceId: e.target.value }))}
          fullWidth
          helperText="Leave blank to use the current workspace."
        />
      </Stack>
    )
  }

  function renderTeamStep() {
    const memberUserIds = new Set(state.members.map((m) => m.user.id))
    const availableUsers = users.filter((u) => !memberUserIds.has(u.id) && u.id !== state.lead?.id)

    return (
      <Stack spacing={3} sx={{ maxWidth: 600 }}>
        <Typography variant="h6">Team Setup</Typography>

        <Autocomplete
          options={users}
          getOptionLabel={(u) => `${u.display_name} (${u.email})`}
          value={state.lead}
          onChange={(_e, val) => setState((prev) => ({ ...prev, lead: val }))}
          renderInput={(params) => <TextField {...params} label="Project Lead" />}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
        />

        <Divider />

        <Typography variant="subtitle2">Team Members</Typography>

        <Autocomplete
          options={availableUsers}
          getOptionLabel={(u) => `${u.display_name} (${u.email})`}
          value={null}
          onChange={handleAddMember}
          renderInput={(params) => <TextField {...params} label="Add team member" />}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          blurOnSelect
        />

        {state.members.length > 0 && (
          <Paper variant="outlined">
            <List disablePadding>
              {state.members.map((member, idx) => (
                <ListItem
                  key={member.user.id}
                  divider={idx < state.members.length - 1}
                  secondaryAction={
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveMember(member.user.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <Avatar src={member.user.avatar_url ?? undefined} sx={{ width: 32, height: 32 }}>
                      {member.user.display_name.charAt(0)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={member.user.display_name}
                    secondary={member.user.email}
                  />
                  <TextField
                    select
                    size="small"
                    value={member.role}
                    onChange={(e) =>
                      handleMemberRoleChange(member.user.id, e.target.value as TeamMember['role'])
                    }
                    sx={{ width: 120, mr: 4 }}
                    variant="standard"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="member">Member</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </TextField>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Stack>
    )
  }

  function renderConfigStep() {
    return (
      <Stack spacing={3}>
        <Typography variant="h6">Configuration</Typography>

        {/* Workflow preview */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountTreeIcon fontSize="small" />
            Workflow (from template)
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(selectedTemplate?.defaultWorkflow ?? []).map((status, idx) => (
                <Chip
                  key={idx}
                  label={status.name}
                  sx={{
                    bgcolor: status.color,
                    color: '#fff',
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              You can customize the workflow after project creation in Settings {'>'} Workflow.
            </Typography>
          </Paper>
        </Box>

        {/* Labels */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LabelIcon fontSize="small" />
            Labels
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {state.labels.map((label, idx) => (
                <Chip
                  key={idx}
                  label={label.name}
                  onDelete={() => handleRemoveLabel(idx)}
                  sx={{
                    bgcolor: label.color,
                    color: '#fff',
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' },
                  }}
                />
              ))}
              {state.labels.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No labels. Add some below.
                </Typography>
              )}
            </Box>
            <AddLabelInline onAdd={handleAddLabel} />
          </Paper>
        </Box>
      </Stack>
    )
  }

  function renderReviewStep() {
    return (
      <Stack spacing={3}>
        <Typography variant="h6">Review & Create</Typography>
        <Typography variant="body2" color="text.secondary">
          Review your project configuration before creating.
        </Typography>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <ReviewRow icon={<SettingsIcon />} label="Template" value={selectedTemplate?.name ?? 'None'} />
            <Divider />
            <ReviewRow icon={<FolderIcon />} label="Name" value={state.name} />
            <ReviewRow icon={<FolderIcon />} label="Key Prefix" value={state.keyPrefix} />
            {state.description && (
              <ReviewRow icon={<FolderIcon />} label="Description" value={state.description} />
            )}
            <Divider />
            <ReviewRow
              icon={<GroupIcon />}
              label="Lead"
              value={state.lead?.display_name ?? 'Not set'}
            />
            <ReviewRow
              icon={<GroupIcon />}
              label="Members"
              value={state.members.length > 0 ? state.members.map((m) => m.user.display_name).join(', ') : 'None'}
            />
            <Divider />
            <ReviewRow
              icon={<AccountTreeIcon />}
              label="Workflow Statuses"
              value={String(selectedTemplate?.defaultWorkflow.length ?? 0)}
            />
            <ReviewRow
              icon={<LabelIcon />}
              label="Labels"
              value={String(state.labels.length)}
            />
          </Stack>
        </Paper>

        {submitError && (
          <Alert severity="error">{submitError}</Alert>
        )}
      </Stack>
    )
  }

  const stepContent = [
    renderTemplateStep,
    renderBasicInfoStep,
    renderTeamStep,
    renderConfigStep,
    renderReviewStep,
  ]

  const isLastStep = activeStep === STEPS.length - 1

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create New Project
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        {stepContent[activeStep]()}
      </Paper>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0 || submitting}
        >
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isLastStep ? (
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={submitting || !canAdvance()}
              startIcon={submitting ? <CircularProgress size={16} /> : undefined}
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canAdvance()}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Inline sub-components
// ---------------------------------------------------------------------------

function ReviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Typography variant="body2" fontWeight={600} sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    </Box>
  )
}

const LABEL_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#3f51b5',
  '#2196f3', '#009688', '#4caf50', '#ff9800',
]

function AddLabelInline({ onAdd }: { onAdd: (name: string, color: string) => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(LABEL_COLORS[0])

  const handleAdd = useCallback(() => {
    if (!name.trim()) return
    onAdd(name.trim(), color)
    setName('')
  }, [name, color, onAdd])

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
      <TextField
        size="small"
        label="New Label"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
          }
        }}
        sx={{ flexGrow: 1, minWidth: 150 }}
      />
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {LABEL_COLORS.map((c) => (
          <Box
            key={c}
            onClick={() => setColor(c)}
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: c,
              cursor: 'pointer',
              border: color === c ? '2px solid' : '2px solid transparent',
              borderColor: color === c ? 'text.primary' : 'transparent',
            }}
          />
        ))}
      </Box>
      <Button size="small" variant="outlined" onClick={handleAdd} disabled={!name.trim()}>
        Add
      </Button>
    </Box>
  )
}
