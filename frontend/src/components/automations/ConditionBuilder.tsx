import { useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import FilterListIcon from '@mui/icons-material/FilterList'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Condition {
  id: string
  field: string
  operator: string
  value: string
}

interface ConditionBuilderProps {
  conditions: Condition[]
  onChange: (conditions: Condition[]) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIELDS = [
  { value: 'priority', label: 'Priority' },
  { value: 'assignee_id', label: 'Assignee' },
  { value: 'status', label: 'Status' },
  { value: 'labels', label: 'Labels' },
  { value: 'issue_type', label: 'Issue Type' },
  { value: 'story_points', label: 'Story Points' },
  { value: 'estimated_hours', label: 'Estimated Hours' },
  { value: 'reporter_id', label: 'Reporter' },
]

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `cond_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const handleAdd = useCallback(() => {
    onChange([
      ...conditions,
      { id: generateId(), field: 'priority', operator: 'equals', value: '' },
    ])
  }, [conditions, onChange])

  const handleRemove = useCallback(
    (id: string) => {
      onChange(conditions.filter((c) => c.id !== id))
    },
    [conditions, onChange],
  )

  const handleUpdate = useCallback(
    (id: string, key: keyof Condition, val: string) => {
      onChange(
        conditions.map((c) => (c.id === id ? { ...c, [key]: val } : c)),
      )
    },
    [conditions, onChange],
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterListIcon color="info" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          IF
        </Typography>
        <Chip label="Conditions (optional)" size="small" color="info" variant="outlined" />
      </Box>

      {conditions.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No conditions — automation will run for every trigger match.
        </Typography>
      )}

      {conditions.map((condition, index) => (
        <Box
          key={condition.id}
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          {index > 0 && (
            <Chip label="AND" size="small" variant="outlined" sx={{ minWidth: 48 }} />
          )}
          {index === 0 && <Box sx={{ minWidth: 48 }} />}

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Field</InputLabel>
            <Select
              value={condition.field}
              label="Field"
              onChange={(e: SelectChangeEvent) =>
                handleUpdate(condition.id, 'field', e.target.value)
              }
            >
              {FIELDS.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Operator</InputLabel>
            <Select
              value={condition.operator}
              label="Operator"
              onChange={(e: SelectChangeEvent) =>
                handleUpdate(condition.id, 'operator', e.target.value)
              }
            >
              {OPERATORS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
            <TextField
              size="small"
              label="Value"
              value={condition.value}
              onChange={(e) => handleUpdate(condition.id, 'value', e.target.value)}
              sx={{ flex: 1 }}
            />
          )}

          <IconButton
            size="small"
            color="error"
            onClick={() => handleRemove(condition.id)}
            aria-label="Remove condition"
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ mt: 0.5 }}
      >
        Add Condition
      </Button>
    </Box>
  )
}
