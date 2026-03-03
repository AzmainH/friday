import { useCallback, type ChangeEvent } from 'react'
import { Zap } from 'lucide-react'

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
// Shared input class
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TriggerSelector({ value, onChange }: TriggerSelectorProps) {
  const handleTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
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
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-primary-500" />
        <span className="text-sm font-semibold text-text-primary">WHEN</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-primary-300 text-primary-700 dark:text-primary-400">
          Trigger
        </span>
      </div>

      <div className="mb-3">
        <label htmlFor="trigger-type" className="block text-xs font-medium text-text-secondary mb-1">
          Trigger Type
        </label>
        <select
          id="trigger-type"
          value={value.trigger_type}
          onChange={handleTypeChange}
          className={inputClass}
        >
          <option value="">Select a trigger...</option>
          {TRIGGER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {selectedTrigger && (
        <p className="text-xs text-text-secondary mb-3">
          {selectedTrigger.description}
        </p>
      )}

      {/* Trigger-specific config fields */}
      {value.trigger_type === 'status_changed' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              From Status (optional)
            </label>
            <input
              type="text"
              placeholder="Any"
              value={(value.trigger_config.from_status as string) ?? ''}
              onChange={(e) => handleConfigChange('from_status', e.target.value || null)}
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              To Status (optional)
            </label>
            <input
              type="text"
              placeholder="Any"
              value={(value.trigger_config.to_status as string) ?? ''}
              onChange={(e) => handleConfigChange('to_status', e.target.value || null)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {value.trigger_type === 'priority_changed' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            New Priority (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. high, critical"
            value={(value.trigger_config.new_priority as string) ?? ''}
            onChange={(e) => handleConfigChange('new_priority', e.target.value || null)}
            className={inputClass}
          />
        </div>
      )}

      {value.trigger_type === 'label_added' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Label Name (optional)
          </label>
          <input
            type="text"
            placeholder="Any label"
            value={(value.trigger_config.label_name as string) ?? ''}
            onChange={(e) => handleConfigChange('label_name', e.target.value || null)}
            className={inputClass}
          />
        </div>
      )}

      {value.trigger_type === 'due_date_approaching' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Days Before Due
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={(value.trigger_config.days_before as number) ?? 3}
            onChange={(e) => handleConfigChange('days_before', Number(e.target.value))}
            className={inputClass}
          />
        </div>
      )}

      {value.trigger_type === 'field_changed' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Field Name
          </label>
          <input
            type="text"
            placeholder="e.g. estimated_hours"
            value={(value.trigger_config.field_name as string) ?? ''}
            onChange={(e) => handleConfigChange('field_name', e.target.value)}
            className={inputClass}
          />
        </div>
      )}
    </div>
  )
}
