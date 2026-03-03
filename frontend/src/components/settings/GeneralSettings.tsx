import { useState, useEffect, useCallback } from 'react'
import {
  useProjectDetail,
  useUpdateProject,
  useUsers,
} from '@/hooks/useProjectSettings'
import type { Project } from '@/types/api'

interface GeneralSettingsProps {
  projectId: string
}

const PROJECT_STATUSES: Project['status'][] = ['active', 'paused', 'completed', 'archived']
const RAG_STATUSES: Project['rag_status'][] = ['green', 'amber', 'red', 'none']

const ragColors: Record<string, string> = {
  green: '#2E9E5A',
  amber: '#E8A317',
  red: '#D84040',
  none: '#A3A3A3',
}

const inputClasses =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

const selectClasses =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

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
    (userId: string) => {
      const user = users.find((u) => u.id === userId) ?? null
      setLeadId(user?.id ?? null)
      updateProject.mutate({ projectId, body: { lead_id: user?.id ?? null } as Partial<Project> })
    },
    [projectId, updateProject, users],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-[600px]">
        <div className="skeleton-shimmer h-14 rounded-lg" />
        <div className="skeleton-shimmer h-14 rounded-lg" />
        <div className="skeleton-shimmer h-28 rounded-lg" />
        <div className="skeleton-shimmer h-14 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        Failed to load project settings.
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="flex flex-col gap-6 max-w-[600px]">
      <h2 className="text-lg font-semibold text-text-primary">General Settings</h2>

      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Project Name
        </label>
        <input
          type="text"
          className={inputClasses}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleBlur('name', name)}
        />
      </div>

      {/* Key Prefix (read-only) */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Key Prefix
        </label>
        <input
          type="text"
          className={`${inputClasses} bg-surface-50 cursor-not-allowed`}
          value={project.key_prefix}
          readOnly
        />
        <p className="text-xs text-text-tertiary mt-1">
          Project key cannot be changed after creation
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Description
        </label>
        <textarea
          className={`${inputClasses} min-h-[80px] resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => handleBlur('description', description || null)}
          rows={3}
        />
      </div>

      {/* Project Lead */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Project Lead
        </label>
        <select
          className={selectClasses}
          value={leadId ?? ''}
          onChange={(e) => handleLeadChange(e.target.value)}
        >
          <option value="">-- None --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name || u.email}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Status
        </label>
        <select
          className={selectClasses}
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as Project['status'])}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* RAG Status */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          RAG Status
        </label>
        <select
          className={selectClasses}
          value={ragStatus}
          onChange={(e) => handleRagChange(e.target.value as Project['rag_status'])}
        >
          {RAG_STATUSES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        {/* RAG color indicator */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: ragColors[ragStatus] }}
          />
          <span className="text-xs text-text-tertiary">
            Current: {ragStatus.charAt(0).toUpperCase() + ragStatus.slice(1)}
          </span>
        </div>
      </div>

      {updateProject.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          Failed to save changes. Please try again.
        </div>
      )}
    </div>
  )
}
