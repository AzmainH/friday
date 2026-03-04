import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/ui/Avatar'
import { Chip } from '@/components/ui/Chip'
import { Combobox } from '@/components/ui/Combobox'
import { Select } from '@/components/ui/Select'
import {
  LayoutDashboard, Bug, Rocket, Kanban, Settings, Trash2, CheckCircle2,
  FolderKanban, Users, Tag, GitBranch, FileText, FolderOpen,
} from 'lucide-react'
import client from '@/api/client'
import { useUsers } from '@/hooks/useProjectSettings'
import { useOrgStore } from '@/stores/orgStore'
import type { User } from '@/types/api'
import TemplateGallery from '@/components/templates/TemplateGallery'
import UseTemplateDialog from '@/components/templates/UseTemplateDialog'
import type { ProjectTemplate } from '@/hooks/useTemplates'

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
    icon: <Kanban size={40} />,
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
    icon: <LayoutDashboard size={40} />,
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
    icon: <Bug size={40} />,
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
    icon: <Rocket size={40} />,
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

  const [creationMode, setCreationMode] = useState<'scratch' | 'template'>('scratch')
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedApiTemplate, setSelectedApiTemplate] = useState<ProjectTemplate | null>(null)

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
        template_id: null,
        name: state.name,
        key_prefix: state.keyPrefix,
        description: state.description || null,
        workspace_id: state.workspaceId || null,
        lead_id: state.lead?.id ?? null,
      }

      const { data } = await client.post('/wizard/create-project', payload)
      const projectId = data.id ?? data.project_id
      navigate(`/projects/${projectId}/board`)
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Choose a Template</h3>
        <p className="text-sm text-text-secondary">
          Select a project template to start with pre-configured workflows and settings.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={cn(
                'relative p-6 rounded-[--radius-md] border-2 cursor-pointer text-center transition-all',
                state.templateId === template.id
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                  : 'border-surface-200 hover:border-surface-300 bg-white dark:bg-surface-100',
              )}
            >
              <div className={cn(
                'mb-3',
                state.templateId === template.id ? 'text-primary-500' : 'text-text-secondary',
              )}>
                {template.icon}
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">
                {template.name}
              </h4>
              <p className="text-xs text-text-secondary">
                {template.description}
              </p>
              {state.templateId === template.id && (
                <CheckCircle2
                  size={20}
                  className="absolute top-2 right-2 text-primary-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderBasicInfoStep() {
    return (
      <div className="space-y-4 max-w-xl">
        <h3 className="text-lg font-semibold text-text-primary">Basic Information</h3>

        <Input
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
          autoFocus
          required
        />

        <Input
          label="Key Prefix"
          value={state.keyPrefix}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              keyPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            }))
          }
          required
          hint="Used for issue keys (e.g. PROJ-123). Max 5 characters."
          maxLength={5}
        />

        <Textarea
          label="Description"
          value={state.description}
          onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />

        <Input
          label="Workspace ID"
          value={state.workspaceId}
          onChange={(e) => setState((prev) => ({ ...prev, workspaceId: e.target.value }))}
          hint="Leave blank to use the current workspace."
        />
      </div>
    )
  }

  function renderTeamStep() {
    const memberUserIds = new Set(state.members.map((m) => m.user.id))
    const availableUsers = users.filter((u) => !memberUserIds.has(u.id) && u.id !== state.lead?.id)

    return (
      <div className="space-y-4 max-w-xl">
        <h3 className="text-lg font-semibold text-text-primary">Team Setup</h3>

        <Combobox
          label="Project Lead"
          options={users.map((u) => ({ value: u.id, label: `${u.display_name} (${u.email})` }))}
          value={state.lead?.id ?? null}
          onChange={(val) => setState((prev) => ({ ...prev, lead: users.find((u) => u.id === val) ?? null }))}
          placeholder="Search for a user..."
        />

        <div className="border-t border-surface-200" />

        <h4 className="text-sm font-semibold text-text-primary">Team Members</h4>

        <Combobox
          label=""
          options={availableUsers.map((u) => ({ value: u.id, label: `${u.display_name} (${u.email})` }))}
          value={null}
          onChange={(val) => {
            const user = users.find((u) => u.id === val) ?? null
            handleAddMember(null, user)
          }}
          placeholder="Add team member..."
        />

        {state.members.length > 0 && (
          <div className="border border-surface-200 rounded-[--radius-md] divide-y divide-surface-100">
            {state.members.map((member) => (
              <div key={member.user.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={member.user.display_name} src={member.user.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{member.user.display_name}</p>
                  <p className="text-xs text-text-secondary truncate">{member.user.email}</p>
                </div>
                <Select
                  value={member.role}
                  onChange={(val) => handleMemberRoleChange(member.user.id, val as TeamMember['role'])}
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'member', label: 'Member' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                  className="w-32"
                />
                <button
                  onClick={() => handleRemoveMember(member.user.id)}
                  className="p-1.5 text-text-tertiary hover:text-error rounded-[--radius-sm] hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderConfigStep() {
    return (
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-text-primary">Configuration</h3>

        {/* Workflow preview */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <GitBranch size={16} className="text-text-secondary" />
            Workflow (from template)
          </h4>
          <div className="bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-md] p-4">
            <div className="flex flex-wrap gap-1.5">
              {(selectedTemplate?.defaultWorkflow ?? []).map((status, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: status.color }}
                >
                  {status.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              You can customize the workflow after project creation in Settings {'>'} Workflow.
            </p>
          </div>
        </div>

        {/* Labels */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <Tag size={16} className="text-text-secondary" />
            Labels
          </h4>
          <div className="bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-md] p-4">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {state.labels.map((label, idx) => (
                <Chip
                  key={idx}
                  label={label.name}
                  color={label.color}
                  onRemove={() => handleRemoveLabel(idx)}
                />
              ))}
              {state.labels.length === 0 && (
                <p className="text-sm text-text-secondary">
                  No labels. Add some below.
                </p>
              )}
            </div>
            <AddLabelInline onAdd={handleAddLabel} />
          </div>
        </div>
      </div>
    )
  }

  function renderReviewStep() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Review & Create</h3>
        <p className="text-sm text-text-secondary">
          Review your project configuration before creating.
        </p>

        <div className="bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-lg] p-6">
          <div className="space-y-3">
            <ReviewRow icon={<Settings size={18} />} label="Template" value={selectedTemplate?.name ?? 'None'} />
            <div className="border-t border-surface-200" />
            <ReviewRow icon={<FolderKanban size={18} />} label="Name" value={state.name} />
            <ReviewRow icon={<FolderKanban size={18} />} label="Key Prefix" value={state.keyPrefix} />
            {state.description && (
              <ReviewRow icon={<FolderKanban size={18} />} label="Description" value={state.description} />
            )}
            <div className="border-t border-surface-200" />
            <ReviewRow
              icon={<Users size={18} />}
              label="Lead"
              value={state.lead?.display_name ?? 'Not set'}
            />
            <ReviewRow
              icon={<Users size={18} />}
              label="Members"
              value={state.members.length > 0 ? state.members.map((m) => m.user.display_name).join(', ') : 'None'}
            />
            <div className="border-t border-surface-200" />
            <ReviewRow
              icon={<GitBranch size={18} />}
              label="Workflow Statuses"
              value={String(selectedTemplate?.defaultWorkflow.length ?? 0)}
            />
            <ReviewRow
              icon={<Tag size={18} />}
              label="Labels"
              value={String(state.labels.length)}
            />
          </div>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-[--radius-sm]">
            {submitError}
          </div>
        )}
      </div>
    )
  }

  const stepContent = [
    renderTemplateStep,
    renderBasicInfoStep,
    renderTeamStep,
    renderConfigStep,
    renderReviewStep,
  ]

  const handleApiTemplateSelect = useCallback((template: ProjectTemplate) => {
    setSelectedApiTemplate(template)
    setTemplateDialogOpen(true)
  }, [])

  const isLastStep = activeStep === STEPS.length - 1

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Create New Project
      </h1>

      {/* Creation mode tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setCreationMode('scratch')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-[--radius-md] text-sm font-medium border transition-colors',
            creationMode === 'scratch'
              ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
              : 'bg-white text-text-secondary border-surface-200 hover:bg-surface-50 dark:bg-surface-100 dark:border-surface-200',
          )}
        >
          <FileText className="h-4 w-4" />
          Start from scratch
        </button>
        <button
          onClick={() => setCreationMode('template')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-[--radius-md] text-sm font-medium border transition-colors',
            creationMode === 'template'
              ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
              : 'bg-white text-text-secondary border-surface-200 hover:bg-surface-50 dark:bg-surface-100 dark:border-surface-200',
          )}
        >
          <FolderOpen className="h-4 w-4" />
          Use a template
        </button>
      </div>

      {/* Template gallery mode */}
      {creationMode === 'template' && (
        <>
          <div className="bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-lg] p-6 mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Choose a Template
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Browse server-defined templates to quickly set up a project with pre-configured settings.
            </p>
            <TemplateGallery onSelectTemplate={handleApiTemplateSelect} />
          </div>
          <UseTemplateDialog
            template={selectedApiTemplate}
            open={templateDialogOpen}
            onClose={() => setTemplateDialogOpen(false)}
          />
        </>
      )}

      {/* Scratch wizard mode */}
      {creationMode === 'scratch' && (
        <>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors',
              idx < activeStep && 'bg-primary-500 text-white',
              idx === activeStep && 'bg-primary-500 text-white ring-4 ring-primary-100',
              idx > activeStep && 'bg-surface-200 text-text-tertiary',
            )}>
              {idx < activeStep ? <CheckCircle2 size={16} /> : idx + 1}
            </div>
            <span className={cn(
              'ml-2 text-sm font-medium hidden sm:inline',
              idx === activeStep ? 'text-text-primary' : 'text-text-tertiary',
            )}>
              {label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={cn(
                'w-12 h-0.5 mx-3',
                idx < activeStep ? 'bg-primary-500' : 'bg-surface-200',
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-lg] p-6 mb-6">
        {stepContent[activeStep]()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleBack} disabled={activeStep === 0 || submitting}>
          Back
        </Button>
        <Button
          onClick={isLastStep ? handleCreate : handleNext}
          disabled={submitting || !canAdvance()}
          loading={submitting}
        >
          {isLastStep ? (submitting ? 'Creating...' : 'Create Project') : 'Next'}
        </Button>
      </div>
        </>
      )}
    </div>
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
    <div className="flex items-center gap-3">
      <span className="text-text-tertiary">{icon}</span>
      <span className="text-sm font-semibold text-text-primary w-36">{label}</span>
      <span className="text-sm text-text-secondary">{value}</span>
    </div>
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
    <div className="flex items-end gap-2 flex-wrap">
      <div className="flex-1 min-w-[150px]">
        <Input
          label="New Label"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
      </div>
      <div className="flex gap-1">
        {LABEL_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={cn(
              'w-6 h-6 rounded-full transition-all',
              color === c ? 'ring-2 ring-offset-1 ring-text-primary' : '',
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={handleAdd} disabled={!name.trim()}>
        Add
      </Button>
    </div>
  )
}
