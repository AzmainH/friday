import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
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
  switch (field.type) {
    case 'textarea':
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
          multiline
          rows={4}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
        />
      )
    case 'select':
      return (
        <FormControl fullWidth required={field.required}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            label={field.label}
            value={(value as string) ?? ''}
            onChange={(e: SelectChangeEvent) => onChange(e.target.value)}
          >
            {field.options?.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )
    case 'checkbox':
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
          }
          label={
            <span>
              {field.label}
              {field.required && <span style={{ color: 'red' }}> *</span>}
            </span>
          }
        />
      )
    case 'number':
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
          type="number"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
        />
      )
    case 'email':
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder ?? 'email@example.com'}
          required={field.required}
          type="email"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
        />
      )
    case 'date':
      return (
        <TextField
          label={field.label}
          required={field.required}
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )
    default:
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
        />
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
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Thank you!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your submission has been received and is under review.
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        {form.name}
      </Typography>
      {form.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {form.description}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
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
          variant="contained"
          size="large"
          disabled={submitting}
          sx={{ alignSelf: 'flex-start', mt: 1 }}
        >
          {submitting ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </Box>
    </Container>
  )
}
