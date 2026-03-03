import { useState, useCallback } from 'react'
import { Pencil, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import StatusTransitionDropdown from '@/components/issue/StatusTransitionDropdown'
import { useIssueUpdate } from '@/hooks/useIssueDetail'
import { useProjectStore } from '@/stores/projectStore'
import { PRIORITY_COLORS } from '@/utils/formatters'
import type { Issue, User, Label } from '@/types/api'

interface IssueFieldsPanelProps {
  issue: Issue
  members?: User[]
  labels?: Label[]
}

type EditingField = string | null

interface InlineFieldProps {
  label: string
  value: React.ReactNode
  editingField: EditingField
  fieldKey: string
  onStartEdit: (key: string) => void
  onCancel: () => void
  editContent: React.ReactNode
}

function InlineField({
  label,
  value,
  editingField,
  fieldKey,
  onStartEdit,
  onCancel,
  editContent,
}: InlineFieldProps) {
  const isEditing = editingField === fieldKey

  return (
    <div className="py-2">
      <span className="mb-1 block text-xs font-semibold text-text-secondary">
        {label}
      </span>
      {isEditing ? (
        <div className="flex items-start gap-1">
          <div className="flex-1">{editContent}</div>
          <button
            type="button"
            title="Cancel"
            onClick={onCancel}
            className={cn(
              'mt-1 rounded-[--radius-sm] p-1 text-text-secondary',
              'hover:bg-surface-100 hover:text-text-primary',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'group flex cursor-pointer items-center gap-1 rounded-[--radius-sm]',
            '-mx-1 px-1 py-0.5',
            'hover:bg-surface-50 dark:hover:bg-surface-200',
          )}
          onClick={() => onStartEdit(fieldKey)}
        >
          <div className="min-w-0 flex-1">{value}</div>
          <Pencil
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-text-secondary',
              'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
            )}
          />
        </div>
      )}
    </div>
  )
}

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'] as const

export default function IssueFieldsPanel({
  issue,
  members = [],
  labels = [],
}: IssueFieldsPanelProps) {
  const [editingField, setEditingField] = useState<EditingField>(null)
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([])
  const updateMutation = useIssueUpdate()
  const statuses = useProjectStore((s) => s.statuses)

  const saveField = useCallback(
    (field: string, value: unknown) => {
      updateMutation.mutate({ issueId: issue.id, body: { [field]: value } })
      setEditingField(null)
    },
    [issue.id, updateMutation],
  )

  const handleStartEdit = (key: string) => {
    if (key === 'labels') {
      setSelectedLabels(issue.labels ?? [])
    }
    setEditingField(key)
  }

  const handleCancel = () => {
    setEditingField(null)
  }

  const assignee = issue.assignee ?? members.find((m) => m.id === issue.assignee_id)
  const issueLabels = issue.labels ?? []

  return (
    <div className="px-4 py-2">
      {/* Status */}
      <div className="py-2">
        <span className="mb-1 block text-xs font-semibold text-text-secondary">
          Status
        </span>
        <StatusTransitionDropdown
          currentStatusId={issue.status_id}
          statuses={statuses}
          onChange={(statusId) => saveField('status_id', statusId)}
        />
      </div>

      {/* Assignee */}
      <InlineField
        label="Assignee"
        fieldKey="assignee"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          assignee ? (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[0.65rem] font-medium text-primary-700">
                {assignee.avatar_url ? (
                  <img
                    src={assignee.avatar_url}
                    alt={assignee.display_name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  assignee.display_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-sm text-text-primary">{assignee.display_name}</span>
            </div>
          ) : (
            <span className="text-sm text-text-secondary">Unassigned</span>
          )
        }
        editContent={
          <select
            className={cn(
              'w-full rounded-[--radius-sm] border border-surface-200 bg-white px-2 py-1.5 text-sm',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'dark:border-surface-300 dark:bg-surface-100',
            )}
            value={issue.assignee_id ?? ''}
            onChange={(e) => saveField('assignee_id', e.target.value || null)}
            autoFocus
            onBlur={handleCancel}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.display_name}
              </option>
            ))}
          </select>
        }
      />

      {/* Priority */}
      <InlineField
        label="Priority"
        fieldKey="priority"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize text-white"
            style={{ backgroundColor: PRIORITY_COLORS[issue.priority] ?? '#9e9e9e' }}
          >
            {issue.priority}
          </span>
        }
        editContent={
          <select
            className={cn(
              'w-full rounded-[--radius-sm] border border-surface-200 bg-white px-2 py-1.5 text-sm',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'dark:border-surface-300 dark:bg-surface-100',
            )}
            value={issue.priority}
            onChange={(e) => saveField('priority', e.target.value)}
            autoFocus
            onBlur={handleCancel}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        }
      />

      {/* Labels */}
      <InlineField
        label="Labels"
        fieldKey="labels"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          issueLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {issueLabels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-text-secondary">None</span>
          )
        }
        editContent={
          <div className="space-y-1">
            <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-[--radius-sm] border border-surface-200 bg-white p-1 dark:border-surface-300 dark:bg-surface-100">
              {labels.map((label) => {
                const isChecked = selectedLabels.some((l) => l.id === label.id)
                return (
                  <label
                    key={label.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-[--radius-sm] px-2 py-1 text-sm',
                      'hover:bg-surface-50 dark:hover:bg-surface-200',
                      isChecked && 'bg-surface-50 dark:bg-surface-200',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const next = isChecked
                          ? selectedLabels.filter((l) => l.id !== label.id)
                          : [...selectedLabels, label]
                        setSelectedLabels(next)
                      }}
                      className="h-3.5 w-3.5 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-text-primary">{label.name}</span>
                  </label>
                )
              })}
              {labels.length === 0 && (
                <span className="block px-2 py-1 text-xs text-text-secondary">
                  No labels available
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                saveField(
                  'label_ids',
                  selectedLabels.map((l) => l.id),
                )
              }
              className={cn(
                'w-full rounded-[--radius-sm] bg-primary-500 px-3 py-1 text-xs font-medium text-white',
                'hover:bg-primary-600 transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              )}
            >
              Apply
            </button>
          </div>
        }
      />

      {/* Due Date */}
      <InlineField
        label="Due Date"
        fieldKey="due_date"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <span className={cn('text-sm', issue.due_date ? 'text-text-primary' : 'text-text-secondary')}>
            {issue.due_date
              ? new Date(issue.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No date'}
          </span>
        }
        editContent={
          <input
            type="date"
            className={cn(
              'w-full rounded-[--radius-sm] border border-surface-200 bg-white px-2 py-1.5 text-sm',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'dark:border-surface-300 dark:bg-surface-100',
            )}
            defaultValue={issue.due_date ?? ''}
            onChange={(e) => saveField('due_date', e.target.value || null)}
            autoFocus
          />
        }
      />

      {/* Story Points */}
      <InlineField
        label="Story Points"
        fieldKey="story_points"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <span className={cn('text-sm', issue.story_points != null ? 'text-text-primary' : 'text-text-secondary')}>
            {issue.story_points ?? 'Not set'}
          </span>
        }
        editContent={
          <input
            type="number"
            className={cn(
              'w-full rounded-[--radius-sm] border border-surface-200 bg-white px-2 py-1.5 text-sm',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'dark:border-surface-300 dark:bg-surface-100',
            )}
            defaultValue={issue.story_points ?? ''}
            onBlur={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              saveField('story_points', val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement
                const val = target.value === '' ? null : Number(target.value)
                saveField('story_points', val)
              }
            }}
            autoFocus
            min={0}
            step={1}
          />
        }
      />

      {/* Percent Complete */}
      <div className="py-2">
        <span className="mb-1 block text-xs font-semibold text-text-secondary">
          Progress
        </span>
        <div className="flex items-center gap-3 px-1">
          <input
            type="range"
            className="flex-1 accent-primary-500"
            value={issue.percent_complete}
            onChange={() => {
              // Live update handled by browser; commit on mouse-up
            }}
            onMouseUp={(e) => {
              const val = Number((e.target as HTMLInputElement).value)
              saveField('percent_complete', val)
            }}
            onTouchEnd={(e) => {
              const val = Number((e.target as HTMLInputElement).value)
              saveField('percent_complete', val)
            }}
            min={0}
            max={100}
            step={5}
          />
          <span className="min-w-[36px] text-sm font-medium text-text-primary">
            {issue.percent_complete}%
          </span>
        </div>
      </div>

      {/* Estimated Hours */}
      <InlineField
        label="Estimated Hours"
        fieldKey="estimated_hours"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <span className={cn('text-sm', issue.estimated_hours != null ? 'text-text-primary' : 'text-text-secondary')}>
            {issue.estimated_hours != null ? `${issue.estimated_hours}h` : 'Not set'}
          </span>
        }
        editContent={
          <input
            type="number"
            className={cn(
              'w-full rounded-[--radius-sm] border border-surface-200 bg-white px-2 py-1.5 text-sm',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'dark:border-surface-300 dark:bg-surface-100',
            )}
            defaultValue={issue.estimated_hours ?? ''}
            onBlur={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              saveField('estimated_hours', val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement
                const val = target.value === '' ? null : Number(target.value)
                saveField('estimated_hours', val)
              }
            }}
            autoFocus
            min={0}
            step={0.5}
          />
        }
      />

      {/* Actual Hours */}
      <InlineField
        label="Actual Hours"
        fieldKey="actual_hours"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <span className={cn('text-sm', issue.actual_hours != null ? 'text-text-primary' : 'text-text-secondary')}>
            {issue.actual_hours != null ? `${issue.actual_hours}h` : 'Not set'}
          </span>
        }
        editContent={
          <input
            type="number"
            className={cn(
              'w-full rounded-[--radius-sm] border border-surface-200 bg-white px-2 py-1.5 text-sm',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'dark:border-surface-300 dark:bg-surface-100',
            )}
            defaultValue={issue.actual_hours ?? ''}
            onBlur={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              saveField('actual_hours', val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement
                const val = target.value === '' ? null : Number(target.value)
                saveField('actual_hours', val)
              }
            }}
            autoFocus
            min={0}
            step={0.5}
          />
        }
      />
    </div>
  )
}
