import { useCallback, useMemo } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IssueField {
  value: string
  label: string
  required?: boolean
}

interface ColumnMapperProps {
  csvColumns: string[]
  issueFields: IssueField[]
  mapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ISSUE_FIELDS: IssueField[] = [
  { value: 'summary', label: 'Summary', required: true },
  { value: 'description', label: 'Description' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'reporter', label: 'Reporter' },
  { value: 'issue_type', label: 'Issue Type' },
  { value: 'labels', label: 'Labels' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'estimated_hours', label: 'Estimated Hours' },
  { value: 'story_points', label: 'Story Points' },
]

// ---------------------------------------------------------------------------
// Auto-detect logic
// ---------------------------------------------------------------------------

function computeSimilarity(a: string, b: string): number {
  const normalA = a.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normalB = b.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (normalA === normalB) return 1
  if (normalA.includes(normalB) || normalB.includes(normalA)) return 0.7
  // Simple character overlap
  const setA = new Set(normalA)
  const setB = new Set(normalB)
  const intersection = [...setA].filter((c) => setB.has(c)).length
  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}

export function autoDetectMapping(
  csvColumns: string[],
  issueFields: IssueField[],
): Record<string, string> {
  const mapping: Record<string, string> = {}
  const used = new Set<string>()

  for (const col of csvColumns) {
    let bestField = ''
    let bestScore = 0.5 // Minimum threshold

    for (const field of issueFields) {
      if (used.has(field.value)) continue
      const score = Math.max(
        computeSimilarity(col, field.value),
        computeSimilarity(col, field.label),
      )
      if (score > bestScore) {
        bestScore = score
        bestField = field.value
      }
    }

    if (bestField) {
      mapping[col] = bestField
      used.add(bestField)
    }
  }

  return mapping
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ColumnMapper({
  csvColumns,
  issueFields: issueFieldsProp,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  const issueFields = issueFieldsProp.length > 0 ? issueFieldsProp : DEFAULT_ISSUE_FIELDS

  const mappedFieldValues = useMemo(
    () => new Set(Object.values(mapping)),
    [mapping],
  )

  const handleChange = useCallback(
    (csvCol: string, fieldValue: string) => {
      const next = { ...mapping }
      if (fieldValue === '') {
        delete next[csvCol]
      } else {
        next[csvCol] = fieldValue
      }
      onMappingChange(next)
    },
    [mapping, onMappingChange],
  )

  const mappedCount = Object.keys(mapping).length

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-text-primary">
          Column Mapping
        </h4>
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
            mappedCount > 0
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-surface-50 border-surface-200 text-text-secondary',
          )}
        >
          {mappedCount} of {csvColumns.length} mapped
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {csvColumns.map((col) => {
          const isMapped = !!mapping[col]
          return (
            <div
              key={col}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg border transition-all',
                isMapped
                  ? 'bg-primary-50/30 border-primary-300 dark:bg-primary-500/10'
                  : 'bg-white border-surface-200 dark:bg-dark-surface dark:border-dark-border',
              )}
            >
              {/* CSV column name */}
              <div className="flex-1 flex items-center gap-2">
                {isMapped && (
                  <CheckCircle className="h-4 w-4 text-primary-500 flex-shrink-0" />
                )}
                <span className={cn('text-sm', isMapped ? 'font-semibold text-text-primary' : 'text-text-primary')}>
                  {col}
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-4 w-4 text-text-secondary/40 flex-shrink-0" />

              {/* Issue field dropdown */}
              <div className="min-w-[200px]">
                <select
                  value={mapping[col] ?? ''}
                  onChange={(e) => handleChange(col, e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                >
                  <option value="">Skip this column</option>
                  {issueFields.map((f) => (
                    <option
                      key={f.value}
                      value={f.value}
                      disabled={mappedFieldValues.has(f.value) && mapping[col] !== f.value}
                    >
                      {f.label}{f.required ? ' *' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { DEFAULT_ISSUE_FIELDS }
