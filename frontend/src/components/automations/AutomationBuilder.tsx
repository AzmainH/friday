import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import type { AutomationRule } from '@/types/api'
import TriggerSelector, { type TriggerConfig } from '@/components/automations/TriggerSelector'
import ConditionBuilder, { type Condition } from '@/components/automations/ConditionBuilder'
import ActionSelector, { type ActionConfig } from '@/components/automations/ActionSelector'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutomationBuilderOutput {
  name: string
  is_enabled: boolean
  trigger_type: string
  trigger_config: Record<string, unknown>
  condition_config: Record<string, unknown> | null
  action_type: string
  action_config: Record<string, unknown>
}

interface AutomationBuilderProps {
  rule?: AutomationRule
  onSave: (output: AutomationBuilderOutput) => void
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseConditions(config: Record<string, unknown> | null): Condition[] {
  if (!config || !Array.isArray(config.conditions)) return []
  return (config.conditions as Condition[]).map((c, i) => ({
    ...c,
    id: c.id ?? `cond_init_${i}`,
  }))
}

function conditionsToConfig(conditions: Condition[]): Record<string, unknown> | null {
  if (conditions.length === 0) return null
  return {
    logic: 'and',
    conditions: conditions.map(({ field, operator, value }) => ({
      field,
      operator,
      value,
    })),
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AutomationBuilder({ rule, onSave, onCancel }: AutomationBuilderProps) {
  const [name, setName] = useState(rule?.name ?? '')
  const [isEnabled, setIsEnabled] = useState(rule?.is_enabled ?? true)
  const [trigger, setTrigger] = useState<TriggerConfig>({
    trigger_type: rule?.trigger_type ?? '',
    trigger_config: rule?.trigger_config ?? {},
  })
  const [conditions, setConditions] = useState<Condition[]>(
    parseConditions(rule?.condition_config ?? null),
  )
  const [action, setAction] = useState<ActionConfig>({
    action_type: rule?.action_type ?? '',
    action_config: rule?.action_config ?? {},
  })

  const isValid = name.trim() !== '' && trigger.trigger_type !== '' && action.action_type !== ''

  const handleSave = useCallback(() => {
    if (!isValid) return
    onSave({
      name: name.trim(),
      is_enabled: isEnabled,
      trigger_type: trigger.trigger_type,
      trigger_config: trigger.trigger_config,
      condition_config: conditionsToConfig(conditions),
      action_type: action.action_type,
      action_config: action.action_config,
    })
  }, [isValid, name, isEnabled, trigger, conditions, action, onSave])

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 2,
      }}
    >
      {/* Header: name + enable toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          label="Automation Name"
          placeholder="e.g. Auto-assign high priority bugs"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              color="primary"
            />
          }
          label={isEnabled ? 'Enabled' : 'Disabled'}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Step 1: WHEN — Trigger */}
      <Box sx={{ mb: 2 }}>
        <TriggerSelector value={trigger} onChange={setTrigger} />
      </Box>

      {/* Arrow connector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
        <ArrowDownwardIcon color="action" />
      </Box>

      {/* Step 2: IF — Conditions (optional) */}
      <Box sx={{ mb: 2 }}>
        <ConditionBuilder conditions={conditions} onChange={setConditions} />
      </Box>

      {/* Arrow connector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
        <ArrowDownwardIcon color="action" />
      </Box>

      {/* Step 3: THEN — Action */}
      <Box sx={{ mb: 3 }}>
        <ActionSelector value={action} onChange={setAction} />
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Footer buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<CancelIcon />}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!isValid}
        >
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </Box>
    </Paper>
  )
}
