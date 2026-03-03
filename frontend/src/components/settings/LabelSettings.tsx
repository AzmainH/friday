import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
      <div className="space-y-4">
        <div className="skeleton-shimmer h-12 rounded-lg" />
        <div className="skeleton-shimmer h-52 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        Failed to load labels.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Labels</h3>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateDialog}>
          Add Label
        </Button>
      </div>

      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface divide-y divide-surface-200">
        {labels.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-text-primary">No labels defined</p>
            <p className="text-xs text-text-secondary mt-1">Add labels to categorise and filter issues.</p>
          </div>
        )}
        {labels.map((label) => (
          <div key={label.id} className="flex items-center px-4 py-3">
            {/* Color swatch */}
            <div
              className="w-6 h-6 rounded flex-shrink-0 mr-3 border border-surface-200"
              style={{ backgroundColor: label.color }}
            />

            {/* Label info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{label.name}</p>
              <p className="text-xs text-text-secondary">{label.color}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => openEditDialog(label)}
                aria-label="Edit label"
                className="inline-flex items-center justify-center rounded-[--radius-sm] p-1.5 text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(label.id)}
                aria-label="Delete label"
                className="inline-flex items-center justify-center rounded-[--radius-sm] p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? 'Edit Label' : 'New Label'} size="sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="label-name" className="block text-sm font-medium text-text-primary mb-1">Label Name</label>
            <input
              id="label-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-text-primary mb-1">Color</span>
            <div className="flex flex-wrap gap-2 mb-3">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                  className="w-8 h-8 rounded cursor-pointer transition-all hover:opacity-80"
                  style={{
                    backgroundColor: c,
                    border: form.color === c ? '3px solid var(--color-text-primary, #111)' : '2px solid transparent',
                  }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>

            {/* Custom color input */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded flex-shrink-0 border border-surface-200"
                style={{ backgroundColor: form.color }}
              />
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                placeholder="#hex"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!form.name.trim() || createLabel.isPending || updateLabel.isPending}
          >
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
