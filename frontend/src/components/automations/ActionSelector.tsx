import { useCallback } from 'react'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionConfig {
  action_type: string
  action_config: Record<string, unknown>
}

interface ActionSelectorProps {
  value: ActionConfig
  onChange: (value: ActionConfig) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_TYPES = [
  { value: 'change_status', label: 'Change Status', description: 'Move issue to a different status' },
  { value: 'change_assignee', label: 'Change Assignee', description: 'Assign the issue to someone' },
  { value: 'add_label', label: 'Add Label', description: 'Add a label to the issue' },
  { value: 'remove_label', label: 'Remove Label', description: 'Remove a label from the issue' },
  { value: 'add_comment', label: 'Add Comment', description: 'Post an automated comment' },
  { value: 'set_priority', label: 'Set Priority', description: 'Change the issue priority' },
  { value: 'send_notification', label: 'Send Notification', description: 'Send a notification to users' },
  { value: 'set_due_date', label: 'Set Due Date', description: 'Set a relative due date' },
] as const

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActionSelector({ value, onChange }: ActionSelectorProps) {
  const handleTypeChange = useCallback(
    (e: SelectChangeEvent) => {
      onChange({
        action_type: e.target.value,
        action_config: {},
      })
    },
    [onChange],
  )

  const handleConfigChange = useCallback(
    (key: string, val: unknown) => {
      onChange({
        ...value,
        action_config: { ...value.action_config, [key]: val },
      })
    },
    [onChange, value],
  )

  const selectedAction = ACTION_TYPES.find((a) => a.value === value.action_type)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PlayArrowIcon color="success" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          THEN
        </Typography>
        <Chip label="Action" size="small" color="success" variant="outlined" />
      </Box>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Action Type</InputLabel>
        <Select
          value={value.action_type}
          label="Action Type"
          onChange={handleTypeChange}
        >
          {ACTION_TYPES.map((a) => (
            <MenuItem key={a.value} value={a.value}>
              <Box>
                <Typography variant="body2">{a.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {a.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedAction && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {selectedAction.description}
        </Typography>
      )}

      {/* Action-specific config fields */}
      {value.action_type === 'change_status' && (
        <TextField
          size="small"
          label="Target Status"
          placeholder="e.g. In Progress"
          value={(value.action_config.status_name as string) ?? ''}
          onChange={(e) => handleConfigChange('status_name', e.target.value)}
          fullWidth
        />
      )}

      {value.action_type === 'change_assignee' && (
        <TextField
          size="small"
          label="Assignee (user ID or email)"
          placeholder="user@example.com"
          value={(value.action_config.assignee as string) ?? ''}
          onChange={(e) => handleConfigChange('assignee', e.target.value)}
          fullWidth
        />
      )}

      {value.action_type === 'add_label' && (
        <TextField
          size="small"
          label="Label Name"
          placeholder="e.g. urgent"
          value={(value.action_config.label_name as string) ?? ''}
          onChange={(e) => handleConfigChange('label_name', e.target.value)}
          fullWidth
        />
      )}

      {value.action_type === 'remove_label' && (
        <TextField
          size="small"
          label="Label Name"
          placeholder="e.g. triaged"
          value={(value.action_config.label_name as string) ?? ''}
          onChange={(e) => handleConfigChange('label_name', e.target.value)}
          fullWidth
        />
      )}

      {value.action_type === 'add_comment' && (
        <TextField
          size="small"
          label="Comment Text"
          placeholder="Automated comment..."
          value={(value.action_config.comment_text as string) ?? ''}
          onChange={(e) => handleConfigChange('comment_text', e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      )}

      {value.action_type === 'set_priority' && (
        <FormControl fullWidth size="small">
          <InputLabel>Priority</InputLabel>
          <Select
            value={(value.action_config.priority as string) ?? ''}
            label="Priority"
            onChange={(e: SelectChangeEvent) => handleConfigChange('priority', e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <MenuItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {value.action_type === 'send_notification' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            size="small"
            label="Recipients (comma-separated emails)"
            placeholder="user1@example.com, user2@example.com"
            value={(value.action_config.recipients as string) ?? ''}
            onChange={(e) => handleConfigChange('recipients', e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Message"
            placeholder="Notification message..."
            value={(value.action_config.message as string) ?? ''}
            onChange={(e) => handleConfigChange('message', e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </Box>
      )}

      {value.action_type === 'set_due_date' && (
        <TextField
          size="small"
          label="Days from now"
          type="number"
          value={(value.action_config.days_from_now as number) ?? 7}
          onChange={(e) => handleConfigChange('days_from_now', Number(e.target.value))}
          fullWidth
          slotProps={{ htmlInput: { min: 1, max: 365 } }}
        />
      )}
    </Box>
  )
}
