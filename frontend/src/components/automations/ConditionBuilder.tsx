import { useCallback, type ChangeEvent } from 'react'
import { Plus, Trash2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
// Shared classes
// ---------------------------------------------------------------------------

const selectClass =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

const inputClass =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

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
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-semibold text-text-primary">IF</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-blue-300 text-blue-700 dark:text-blue-400">
          Conditions (optional)
        </span>
      </div>

      {conditions.length === 0 && (
        <p className="text-sm text-text-secondary mb-2">
          No conditions — automation will run for every trigger match.
        </p>
      )}

      {conditions.map((condition, index) => (
        <div
          key={condition.id}
          className="flex gap-2 items-center mb-3"
        >
          {index > 0 ? (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-200 text-text-secondary min-w-[48px]">
              AND
            </span>
          ) : (
            <div className="min-w-[48px]" />
          )}

          <select
            value={condition.field}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleUpdate(condition.id, 'field', e.target.value)
            }
            className={selectClass}
            style={{ minWidth: 140 }}
          >
            {FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleUpdate(condition.id, 'operator', e.target.value)
            }
            className={selectClass}
            style={{ minWidth: 160 }}
          >
            {OPERATORS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
            <input
              type="text"
              placeholder="Value"
              value={condition.value}
              onChange={(e) => handleUpdate(condition.id, 'value', e.target.value)}
              className={inputClass + ' flex-1'}
            />
          )}

          <button
            onClick={() => handleRemove(condition.id)}
            aria-label="Remove condition"
            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={handleAdd}
        className="mt-1"
      >
        Add Condition
      </Button>
    </div>
  )
}
