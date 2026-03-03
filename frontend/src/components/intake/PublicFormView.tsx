import { useState, useCallback } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import client from '@/api/client'
import type { IntakeForm, FormField } from '@/hooks/useIntakeForms'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicFormViewProps {
  form: IntakeForm
}

// ---------------------------------------------------------------------------
// Field renderer
// ---------------------------------------------------------------------------

function RenderField({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: unknown
  onChange: (val: unknown) => void
}) {
  const inputClasses =
    'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <textarea
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
          />
        </div>
      )
    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <select
            required={field.required}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )
    case 'checkbox':
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-surface-300"
          />
          <span className="text-sm text-text-primary">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
        </label>
      )
    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="number"
            placeholder={field.placeholder}
            required={field.required}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
          />
        </div>
      )
    case 'email':
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="email"
            placeholder={field.placeholder ?? 'email@example.com'}
            required={field.required}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
          />
        </div>
      )
    case 'date':
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="date"
            required={field.required}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
          />
        </div>
      )
    default:
      return (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="text"
            placeholder={field.placeholder}
            required={field.required}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
          />
        </div>
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PublicFormView({ form }: PublicFormViewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback((fieldId: string, val: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitting(true)
      setError(null)

      try {
        await client.post(`/intake-forms/${form.id}/submissions`, { data: values })
        setSubmitted(true)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Submission failed. Please try again.',
        )
      } finally {
        setSubmitting(false)
      }
    },
    [form.id, values],
  )

  // Success state
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Thank you!
        </h2>
        <p className="text-base text-text-secondary">
          Your submission has been received and is under review.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">
        {form.name}
      </h1>
      {form.description && (
        <p className="text-base text-text-secondary mb-8">
          {form.description}
        </p>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        {form.fields_schema.map((field) => (
          <RenderField
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(val) => handleChange(field.id, val)}
          />
        ))}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={submitting}
          loading={submitting}
          className="self-start mt-2"
        >
          Submit
        </Button>
      </form>
    </div>
  )
}
