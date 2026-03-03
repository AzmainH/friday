import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
      <div className="space-y-4">
        <div className="skeleton-shimmer h-12 rounded-lg" />
        <div className="skeleton-shimmer h-52 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        Failed to load custom fields.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Custom Fields</h3>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateDialog}>
          Add Field
        </Button>
      </div>

      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Options</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-text-secondary border-t border-surface-200">
                  No custom fields defined. Add fields to extend your issue tracking.
                </td>
              </tr>
            )}
            {fields.map((field) => (
              <tr key={field.id}>
                <td className="px-4 py-2 border-t border-surface-200">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{field.name}</span>
                    {field.is_required && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50">
                        Required
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 border-t border-surface-200">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-300 text-text-secondary">
                    {FIELD_TYPE_LABELS[field.field_type]}
                  </span>
                </td>
                <td className="px-4 py-2 border-t border-surface-200">
                  {field.options && field.options.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {field.options.slice(0, 5).map((opt) => (
                        <span key={opt} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-text-primary">
                          {opt}
                        </span>
                      ))}
                      {field.options.length > 5 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-300 text-text-secondary">
                          +{field.options.length - 5} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-text-secondary">--</span>
                  )}
                </td>
                <td className="px-4 py-2 border-t border-surface-200 text-center">
                  <button
                    type="button"
                    onClick={() => openEditDialog(field)}
                    aria-label="Edit field"
                    className="inline-flex items-center justify-center rounded-[--radius-sm] p-1.5 text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(field.id)}
                    aria-label="Delete field"
                    className="inline-flex items-center justify-center rounded-[--radius-sm] p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? 'Edit Custom Field' : 'New Custom Field'} size="sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="cf-name" className="block text-sm font-medium text-text-primary mb-1">Field Name</label>
            <input
              id="cf-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
            />
          </div>

          <div>
            <label htmlFor="cf-type" className="block text-sm font-medium text-text-primary mb-1">Field Type</label>
            <select
              id="cf-type"
              value={form.field_type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  field_type: e.target.value as CustomFieldDefinition['field_type'],
                }))
              }
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {FIELD_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {hasOptions && (
            <div>
              <label htmlFor="cf-options" className="block text-sm font-medium text-text-primary mb-1">Options</label>
              <textarea
                id="cf-options"
                value={form.options}
                onChange={(e) => setForm((prev) => ({ ...prev, options: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
              />
              <p className="mt-1 text-xs text-text-secondary">Comma-separated list of options (e.g. Low, Medium, High)</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!form.name.trim() || createField.isPending || updateField.isPending}
          >
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
