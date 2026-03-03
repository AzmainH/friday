import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Bug, CheckSquare, Bookmark } from 'lucide-react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
  { value: 'bug', label: 'Bug', component: Bug },
  { value: 'task', label: 'Task', component: CheckSquare },
  { value: 'story', label: 'Story', component: Bookmark },
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
    return <Icon className="h-5 w-5" />
  }
  return <CheckSquare className="h-5 w-5" />
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
      <div className="space-y-4">
        <div className="skeleton-shimmer h-12 rounded-lg" />
        <div className="skeleton-shimmer h-52 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        Failed to load issue types.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Issue Types</h3>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateDialog}>
          Add Issue Type
        </Button>
      </div>

      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface divide-y divide-surface-200">
        {issueTypes.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-text-primary">No issue types defined</p>
            <p className="text-xs text-text-secondary mt-1">Add issue types like Bug, Task, Story to categorise your work.</p>
          </div>
        )}
        {issueTypes.map((it) => (
          <div key={it.id} className="flex items-center px-4 py-3">
            {/* Icon */}
            <div className="mr-3 flex-shrink-0" style={{ color: it.color ?? 'inherit' }}>
              {getIconComponent(it.icon)}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{it.name}</span>
                {it.is_subtask && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-300 text-text-secondary">
                    Subtask
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: it.color ?? '#9e9e9e' }}
                />
                <span className="text-xs text-text-secondary">{it.color ?? 'No color'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => openEditDialog(it)}
                aria-label="Edit issue type"
                className="inline-flex items-center justify-center rounded-[--radius-sm] p-1.5 text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(it.id)}
                aria-label="Delete issue type"
                className="inline-flex items-center justify-center rounded-[--radius-sm] p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? 'Edit Issue Type' : 'New Issue Type'} size="sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="it-name" className="block text-sm font-medium text-text-primary mb-1">Name</label>
            <input
              id="it-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
            />
          </div>

          <div>
            <label htmlFor="it-icon" className="block text-sm font-medium text-text-primary mb-1">Icon</label>
            <select
              id="it-icon"
              value={form.icon}
              onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-text-primary mb-1">Color</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                  className="w-8 h-8 rounded-full cursor-pointer transition-all hover:opacity-80"
                  style={{
                    backgroundColor: c,
                    border: form.color === c ? '3px solid var(--color-primary-500)' : '2px solid transparent',
                  }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_subtask}
              onChange={(e) => setForm((prev) => ({ ...prev, is_subtask: e.target.checked }))}
              className="rounded border-surface-300 text-primary-500 focus:ring-primary-500/30"
            />
            <span className="text-sm text-text-primary">Is Subtask Type</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!form.name.trim() || createIssueType.isPending || updateIssueType.isPending}
          >
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
