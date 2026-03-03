import { useCallback } from 'react'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import BoltIcon from '@mui/icons-material/Bolt'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TriggerConfig {
  trigger_type: string
  trigger_config: Record<string, unknown>
}

interface TriggerSelectorProps {
  value: TriggerConfig
  onChange: (value: TriggerConfig) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRIGGER_TYPES = [
  { value: 'issue_created', label: 'Issue Created', description: 'When a new issue is created' },
  { value: 'status_changed', label: 'Status Changed', description: 'When an issue status changes' },
  { value: 'assignee_changed', label: 'Assignee Changed', description: 'When an issue is assigned or reassigned' },
  { value: 'priority_changed', label: 'Priority Changed', description: 'When issue priority is updated' },
  { value: 'label_added', label: 'Label Added', description: 'When a label is added to an issue' },
  { value: 'comment_added', label: 'Comment Added', description: 'When a comment is posted on an issue' },
  { value: 'due_date_approaching', label: 'Due Date Approaching', description: 'When an issue is nearing its due date' },
  { value: 'field_changed', label: 'Field Changed', description: 'When a specific field is modified' },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TriggerSelector({ value, onChange }: TriggerSelectorProps) {
  const handleTypeChange = useCallback(
    (e: SelectChangeEvent) => {
      onChange({
        trigger_type: e.target.value,
        trigger_config: {},
      })
    },
    [onChange],
  )

  const handleConfigChange = useCallback(
    (key: string, val: unknown) => {
      onChange({
        ...value,
        trigger_config: { ...value.trigger_config, [key]: val },
      })
    },
    [onChange, value],
  )

  const selectedTrigger = TRIGGER_TYPES.find((t) => t.value === value.trigger_type)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <BoltIcon color="warning" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          WHEN
        </Typography>
        <Chip label="Trigger" size="small" color="warning" variant="outlined" />
      </Box>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Trigger Type</InputLabel>
        <Select
          value={value.trigger_type}
          label="Trigger Type"
          onChange={handleTypeChange}
        >
          {TRIGGER_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              <Box>
                <Typography variant="body2">{t.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedTrigger && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {selectedTrigger.description}
        </Typography>
      )}

      {/* Trigger-specific config fields */}
      {value.trigger_type === 'status_changed' && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            label="From Status (optional)"
            placeholder="Any"
            value={(value.trigger_config.from_status as string) ?? ''}
            onChange={(e) => handleConfigChange('from_status', e.target.value || null)}
            fullWidth
          />
          <TextField
            size="small"
            label="To Status (optional)"
            placeholder="Any"
            value={(value.trigger_config.to_status as string) ?? ''}
            onChange={(e) => handleConfigChange('to_status', e.target.value || null)}
            fullWidth
          />
        </Box>
      )}

      {value.trigger_type === 'priority_changed' && (
        <TextField
          size="small"
          label="New Priority (optional)"
          placeholder="e.g. high, critical"
          value={(value.trigger_config.new_priority as string) ?? ''}
          onChange={(e) => handleConfigChange('new_priority', e.target.value || null)}
          fullWidth
        />
      )}

      {value.trigger_type === 'label_added' && (
        <TextField
          size="small"
          label="Label Name (optional)"
          placeholder="Any label"
          value={(value.trigger_config.label_name as string) ?? ''}
          onChange={(e) => handleConfigChange('label_name', e.target.value || null)}
          fullWidth
        />
      )}

      {value.trigger_type === 'due_date_approaching' && (
        <TextField
          size="small"
          label="Days Before Due"
          type="number"
          value={(value.trigger_config.days_before as number) ?? 3}
          onChange={(e) => handleConfigChange('days_before', Number(e.target.value))}
          fullWidth
          slotProps={{ htmlInput: { min: 1, max: 30 } }}
        />
      )}

      {value.trigger_type === 'field_changed' && (
        <TextField
          size="small"
          label="Field Name"
          placeholder="e.g. estimated_hours"
          value={(value.trigger_config.field_name as string) ?? ''}
          onChange={(e) => handleConfigChange('field_name', e.target.value)}
          fullWidth
        />
      )}
    </Box>
  )
}
