import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import OutlinedInput from '@mui/material/OutlinedInput'
import type { SelectChangeEvent } from '@mui/material/Select'

interface CustomField {
  name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox' | 'url'
  options?: string[]
  value: unknown
}

interface CustomFieldRendererProps {
  field: CustomField
  onChange: (value: unknown) => void
}

export default function CustomFieldRenderer({ field, onChange }: CustomFieldRendererProps) {
  const { name, field_type, options = [], value } = field

  switch (field_type) {
    case 'text':
      return (
        <TextField
          label={name}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          fullWidth
          variant="outlined"
        />
      )

    case 'number':
      return (
        <TextField
          label={name}
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => {
            const num = e.target.value === '' ? null : Number(e.target.value)
            onChange(num)
          }}
          size="small"
          fullWidth
          variant="outlined"
          slotProps={{
            htmlInput: { step: 'any' },
          }}
        />
      )

    case 'date':
      return (
        <TextField
          label={name}
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          size="small"
          fullWidth
          variant="outlined"
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
      )

    case 'select':
      return (
        <TextField
          label={name}
          select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          size="small"
          fullWidth
          variant="outlined"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      )

    case 'multi_select': {
      const selected = (value as string[]) ?? []
      return (
        <Select
          label={name}
          multiple
          value={selected}
          onChange={(e: SelectChangeEvent<string[]>) => {
            const val = e.target.value
            onChange(typeof val === 'string' ? val.split(',') : val)
          }}
          size="small"
          fullWidth
          input={<OutlinedInput label={name} />}
          renderValue={(sel) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(sel as string[]).map((v) => (
                <Chip key={v} label={v} size="small" />
              ))}
            </Box>
          )}
        >
          {options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      )
    }

    case 'checkbox':
      return (
        <FormControlLabel
          label={name}
          control={
            <Checkbox
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              size="small"
            />
          }
        />
      )

    case 'url':
      return (
        <TextField
          label={name}
          type="url"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          fullWidth
          variant="outlined"
          placeholder="https://..."
        />
      )

    default:
      return (
        <TextField
          label={name}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          fullWidth
          variant="outlined"
        />
      )
  }
}
