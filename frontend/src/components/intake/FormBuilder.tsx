import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
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
  switch (field.type) {
    case 'textarea':
      return (
        <TextField
          label={field.label || 'Untitled'}
          placeholder={field.placeholder}
          required={field.required}
          multiline
          rows={3}
          fullWidth
          size="small"
          disabled
        />
      )
    case 'select':
      return (
        <FormControl fullWidth size="small" disabled>
          <InputLabel>{field.label || 'Untitled'}</InputLabel>
          <Select label={field.label || 'Untitled'} value="">
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
          control={<Checkbox disabled />}
          label={field.label || 'Untitled'}
        />
      )
    default:
      return (
        <TextField
          label={field.label || 'Untitled'}
          placeholder={field.placeholder}
          required={field.required}
          type={field.type}
          fullWidth
          size="small"
          disabled
        />
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const [tab, setTab] = useState(0) // 0 = edit, 1 = preview

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
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Edit Fields" />
        <Tab label="Preview" />
      </Tabs>

      {/* Edit tab */}
      {tab === 0 && (
        <Box>
          {fields.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No fields yet. Click "Add Field" to start building your form.
            </Typography>
          )}

          {fields.map((field, index) => (
            <Card
              key={field.id}
              variant="outlined"
              sx={{ mb: 2, borderRadius: 2 }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {/* Field label */}
                  <TextField
                    size="small"
                    label="Field Label"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    sx={{ flex: 1 }}
                  />

                  {/* Field type */}
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={field.type}
                      label="Type"
                      onChange={(e: SelectChangeEvent) =>
                        updateField(field.id, { type: e.target.value as FormField['type'] })
                      }
                    >
                      {FIELD_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Required toggle */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.required ?? false}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        size="small"
                      />
                    }
                    label="Required"
                  />
                </Box>

                {/* Placeholder */}
                <TextField
                  size="small"
                  label="Placeholder"
                  value={field.placeholder ?? ''}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                />

                {/* Options for select type */}
                {field.type === 'select' && (
                  <TextField
                    size="small"
                    label="Options (one per line)"
                    multiline
                    rows={3}
                    value={field.options?.map((o) => o.label).join('\n') ?? ''}
                    onChange={(e) => updateOptions(field.id, e.target.value)}
                    fullWidth
                    sx={{ mb: 1 }}
                  />
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={`#${index + 1} ${FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}`}
                    size="small"
                    variant="outlined"
                  />
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => moveField(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => moveField(index, 1)}
                      disabled={index === fields.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeField(field.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          <Button startIcon={<AddIcon />} onClick={addField}>
            Add Field
          </Button>
        </Box>
      )}

      {/* Preview tab */}
      {tab === 1 && (
        <Box
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          {fields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No fields to preview.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {fields.map((field) => (
                <FieldPreview key={field.id} field={field} />
              ))}
              <Button variant="contained" disabled sx={{ alignSelf: 'flex-start' }}>
                Submit
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
