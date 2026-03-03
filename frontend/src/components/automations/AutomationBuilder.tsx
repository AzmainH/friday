import { useState, useCallback } from 'react'
import { ArrowDown, Save, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
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
    <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface dark:border-dark-border p-6">
      {/* Header: name + enable toggle */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="automation-name" className="block text-xs font-medium text-text-secondary mb-1">
            Automation Name
          </label>
          <input
            id="automation-name"
            type="text"
            placeholder="e.g. Auto-assign high priority bugs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            role="switch"
            type="button"
            aria-checked={isEnabled}
            onClick={() => setIsEnabled(!isEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              isEnabled ? 'bg-primary-500' : 'bg-surface-300',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                isEnabled ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <span className="text-sm text-text-secondary">{isEnabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      <hr className="border-surface-200 mb-6" />

      {/* Step 1: WHEN -- Trigger */}
      <div className="mb-4">
        <TriggerSelector value={trigger} onChange={setTrigger} />
      </div>

      {/* Arrow connector */}
      <div className="flex justify-center my-2">
        <ArrowDown className="h-5 w-5 text-text-tertiary" />
      </div>

      {/* Step 2: IF -- Conditions (optional) */}
      <div className="mb-4">
        <ConditionBuilder conditions={conditions} onChange={setConditions} />
      </div>

      {/* Arrow connector */}
      <div className="flex justify-center my-2">
        <ArrowDown className="h-5 w-5 text-text-tertiary" />
      </div>

      {/* Step 3: THEN -- Action */}
      <div className="mb-6">
        <ActionSelector value={action} onChange={setAction} />
      </div>

      <hr className="border-surface-200 mb-4" />

      {/* Footer buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="ghost"
          leftIcon={<X className="h-4 w-4" />}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          leftIcon={<Save className="h-4 w-4" />}
          onClick={handleSave}
          disabled={!isValid}
        >
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </div>
  )
}
