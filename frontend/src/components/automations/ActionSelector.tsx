import { useCallback, type ChangeEvent } from 'react'
import { Play } from 'lucide-react'

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
// Shared classes
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

const selectClass = inputClass

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActionSelector({ value, onChange }: ActionSelectorProps) {
  const handleTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
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
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Play className="h-4 w-4 text-green-500" />
        <span className="text-sm font-semibold text-text-primary">THEN</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-green-300 text-green-700 dark:text-green-400">
          Action
        </span>
      </div>

      <div className="mb-3">
        <label htmlFor="action-type" className="block text-xs font-medium text-text-secondary mb-1">
          Action Type
        </label>
        <select
          id="action-type"
          value={value.action_type}
          onChange={handleTypeChange}
          className={selectClass}
        >
          <option value="">Select an action...</option>
          {ACTION_TYPES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {selectedAction && (
        <p className="text-xs text-text-secondary mb-3">
          {selectedAction.description}
        </p>
      )}

      {/* Action-specific config fields */}
      {value.action_type === 'change_status' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Target Status
          </label>
          <input
            type="text"
            placeholder="e.g. In Progress"
            value={(value.action_config.status_name as string) ?? ''}
            onChange={(e) => handleConfigChange('status_name', e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {value.action_type === 'change_assignee' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Assignee (user ID or email)
          </label>
          <input
            type="text"
            placeholder="user@example.com"
            value={(value.action_config.assignee as string) ?? ''}
            onChange={(e) => handleConfigChange('assignee', e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {value.action_type === 'add_label' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Label Name
          </label>
          <input
            type="text"
            placeholder="e.g. urgent"
            value={(value.action_config.label_name as string) ?? ''}
            onChange={(e) => handleConfigChange('label_name', e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {value.action_type === 'remove_label' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Label Name
          </label>
          <input
            type="text"
            placeholder="e.g. triaged"
            value={(value.action_config.label_name as string) ?? ''}
            onChange={(e) => handleConfigChange('label_name', e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {value.action_type === 'add_comment' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Comment Text
          </label>
          <textarea
            placeholder="Automated comment..."
            value={(value.action_config.comment_text as string) ?? ''}
            onChange={(e) => handleConfigChange('comment_text', e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
      )}

      {value.action_type === 'set_priority' && (
        <div>
          <label htmlFor="action-priority" className="block text-xs font-medium text-text-secondary mb-1">
            Priority
          </label>
          <select
            id="action-priority"
            value={(value.action_config.priority as string) ?? ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleConfigChange('priority', e.target.value)}
            className={selectClass}
          >
            <option value="">Select priority...</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {value.action_type === 'send_notification' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Recipients (comma-separated emails)
            </label>
            <input
              type="text"
              placeholder="user1@example.com, user2@example.com"
              value={(value.action_config.recipients as string) ?? ''}
              onChange={(e) => handleConfigChange('recipients', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Message
            </label>
            <textarea
              placeholder="Notification message..."
              value={(value.action_config.message as string) ?? ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {value.action_type === 'set_due_date' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Days from now
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={(value.action_config.days_from_now as number) ?? 7}
            onChange={(e) => handleConfigChange('days_from_now', Number(e.target.value))}
            className={inputClass}
          />
        </div>
      )}
    </div>
  )
}
