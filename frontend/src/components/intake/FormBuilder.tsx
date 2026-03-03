import { useState, useCallback } from 'react'
import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import type { FormField, FormFieldOption } from '@/hooks/useIntakeForms'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormBuilderProps {
  fields: FormField[]
  onChange: (fields: FormField[]) => void
}

const FIELD_TYPES: { value: FormField['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select / Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyField(): FormField {
  return {
    id: generateFieldId(),
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
  }
}

// ---------------------------------------------------------------------------
// Preview sub-component
// ---------------------------------------------------------------------------

function FieldPreview({ field }: { field: FormField }) {
  const labelText = field.label || 'Untitled'

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {labelText}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <textarea
            placeholder={field.placeholder}
            rows={3}
            disabled
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-text-secondary cursor-not-allowed dark:bg-dark-surface dark:border-dark-border"
          />
        </div>
      )
    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {labelText}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <select
            disabled
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-text-secondary cursor-not-allowed dark:bg-dark-surface dark:border-dark-border"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )
    case 'checkbox':
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled className="h-4 w-4 rounded border-surface-300" />
          <span className="text-sm text-text-primary">{labelText}</span>
        </label>
      )
    default:
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {labelText}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type={field.type}
            placeholder={field.placeholder}
            disabled
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-text-secondary cursor-not-allowed dark:bg-dark-surface dark:border-dark-border"
          />
        </div>
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const [tab, setTab] = useState<0 | 1>(0) // 0 = edit, 1 = preview

  const addField = useCallback(() => {
    onChange([...fields, createEmptyField()])
  }, [fields, onChange])

  const removeField = useCallback(
    (id: string) => {
      onChange(fields.filter((f) => f.id !== id))
    },
    [fields, onChange],
  )

  const updateField = useCallback(
    (id: string, updates: Partial<FormField>) => {
      onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
    },
    [fields, onChange],
  )

  const moveField = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction
      if (target < 0 || target >= fields.length) return
      const next = [...fields]
      const temp = next[index]
      next[index] = next[target]
      next[target] = temp
      onChange(next)
    },
    [fields, onChange],
  )

  const updateOptions = useCallback(
    (fieldId: string, optionsStr: string) => {
      const options: FormFieldOption[] = optionsStr
        .split('\n')
        .filter((l) => l.trim() !== '')
        .map((l) => ({ label: l.trim(), value: l.trim().toLowerCase().replace(/\s+/g, '_') }))
      updateField(fieldId, { options })
    },
    [updateField],
  )

  return (
    <div>
      {/* Toggle buttons */}
      <div className="flex gap-1 border-b border-surface-200 mb-4">
        <button
          type="button"
          onClick={() => setTab(0)}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
            tab === 0
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
          )}
        >
          Edit Fields
        </button>
        <button
          type="button"
          onClick={() => setTab(1)}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
            tab === 1
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
          )}
        >
          Preview
        </button>
      </div>

      {/* Edit tab */}
      {tab === 0 && (
        <div>
          {fields.length === 0 && (
            <p className="text-sm text-text-secondary mb-4">
              No fields yet. Click &quot;Add Field&quot; to start building your form.
            </p>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface mb-4"
            >
              <div className="p-4">
                <div className="flex gap-3 mb-3">
                  {/* Field label */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Field Label</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                    />
                  </div>

                  {/* Field type */}
                  <div className="min-w-[160px]">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(field.id, { type: e.target.value as FormField['type'] })
                      }
                      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Required toggle */}
                  <label className="flex items-center gap-2 self-end pb-0.5">
                    <input
                      type="checkbox"
                      checked={field.required ?? false}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="h-4 w-4 rounded border-surface-300"
                    />
                    <span className="text-sm text-text-primary">Required</span>
                  </label>
                </div>

                {/* Placeholder */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={field.placeholder ?? ''}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    className="w-full rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                  />
                </div>

                {/* Options for select type */}
                {field.type === 'select' && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Options (one per line)</label>
                    <textarea
                      rows={3}
                      value={field.options?.map((o) => o.label).join('\n') ?? ''}
                      onChange={(e) => updateOptions(field.id, e.target.value)}
                      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-200 text-text-secondary">
                    #{index + 1} {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      className="p-1 rounded text-text-secondary hover:bg-surface-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => moveField(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded text-text-secondary hover:bg-surface-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => moveField(index, 1)}
                      disabled={index === fields.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={addField}
          >
            Add Field
          </Button>
        </div>
      )}

      {/* Preview tab */}
      {tab === 1 && (
        <div className="p-6 border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
          {fields.length === 0 ? (
            <p className="text-sm text-text-secondary text-center">
              No fields to preview.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {fields.map((field) => (
                <FieldPreview key={field.id} field={field} />
              ))}
              <Button variant="primary" disabled className="self-start">
                Submit
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
