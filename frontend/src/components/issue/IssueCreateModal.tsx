import { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
} from '@headlessui/react'
import { X } from 'lucide-react'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { createIssue } from '@/api/issues'
import { useProjectStore } from '@/stores/projectStore'
import { cn } from '@/lib/cn'
import type { Issue, User, Label } from '@/types/api'

const issueSchema = z.object({
  issue_type_id: z.string().min(1, 'Issue type is required'),
  summary: z.string().min(1, 'Summary is required').max(500, 'Summary must be 500 characters or less'),
  description: z.string().optional(),
  priority: z.string().default('medium'),
  assignee_id: z.string().nullable().optional(),
  label_ids: z.array(z.string()).optional(),
  due_date: z.string().nullable().optional(),
  estimated_hours: z.number().nullable().optional(),
  story_points: z.number().nullable().optional(),
  parent_id: z.string().nullable().optional(),
})

type IssueFormValues = z.infer<typeof issueSchema>

interface IssueCreateModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  parentId?: string
  members?: User[]
  labels?: Label[]
}

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'] as const

export default function IssueCreateModal({
  open,
  onClose,
  projectId,
  parentId,
  members = [],
  labels = [],
}: IssueCreateModalProps) {
  const qc = useQueryClient()
  const issueTypes = useProjectStore((s) => s.issueTypes)
  const [description, setDescription] = useState('')
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false)
  const labelRef = useRef<HTMLDivElement>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issue_type_id: '',
      summary: '',
      description: '',
      priority: 'medium',
      assignee_id: null,
      label_ids: [],
      due_date: null,
      estimated_hours: null,
      story_points: null,
      parent_id: parentId ?? null,
    },
  })

  const createMutation = useMutation<Issue, Error, Record<string, unknown>>({
    mutationFn: (body) => createIssue(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    setDescription('')
    onClose()
  }

  const onSubmit = (data: IssueFormValues) => {
    const body: Record<string, unknown> = {
      ...data,
      description: description || null,
      estimated_hours: data.estimated_hours ?? null,
      story_points: data.story_points ?? null,
      due_date: data.due_date || null,
      assignee_id: data.assignee_id || null,
      parent_id: data.parent_id || null,
    }
    createMutation.mutate(body)
  }

  const inputBase =
    'w-full px-3 py-1.5 text-sm border border-surface-200 rounded-[--radius-sm] bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors'
  const inputError = 'border-error focus:ring-error/30 focus:border-error'
  const labelClass = 'block text-xs font-medium text-text-secondary mb-1'

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition duration-200 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-2xl rounded-[--radius-lg] bg-white dark:bg-dark-surface shadow-[--shadow-xl] transition duration-200 data-[closed]:opacity-0 data-[closed]:scale-95"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
            <DialogTitle className="text-lg font-semibold text-text-primary">
              {parentId ? 'Create Sub-task' : 'Create Issue'}
            </DialogTitle>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto border-b border-surface-200">
              {/* Issue Type */}
              <Controller
                name="issue_type_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className={labelClass}>Issue Type</label>
                    <select
                      {...field}
                      className={cn(inputBase, errors.issue_type_id && inputError)}
                    >
                      <option value="">Select issue type...</option>
                      {issueTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.icon ? `${type.icon} ${type.name}` : type.name}
                        </option>
                      ))}
                    </select>
                    {errors.issue_type_id && (
                      <p className="mt-1 text-xs text-error">{errors.issue_type_id.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Summary */}
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className={labelClass}>Summary</label>
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter a brief summary of the issue"
                      autoFocus
                      className={cn(inputBase, errors.summary && inputError)}
                    />
                    {errors.summary && (
                      <p className="mt-1 text-xs text-error">{errors.summary.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Add a description..."
                  minHeight={120}
                />
              </div>

              {/* Priority + Assignee row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={labelClass}>Priority</label>
                      <select {...field} className={inputBase}>
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                />

                <Controller
                  name="assignee_id"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={labelClass}>Assignee</label>
                      <select
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className={inputBase}
                      >
                        <option value="">Unassigned</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              </div>

              {/* Labels */}
              <Controller
                name="label_ids"
                control={control}
                render={({ field }) => {
                  const selectedIds = field.value ?? []
                  const selectedLabels = labels.filter((l) => selectedIds.includes(l.id))

                  const toggleLabel = (labelId: string) => {
                    const current = field.value ?? []
                    if (current.includes(labelId)) {
                      field.onChange(current.filter((id) => id !== labelId))
                    } else {
                      field.onChange([...current, labelId])
                    }
                  }

                  return (
                    <div ref={labelRef} className="relative">
                      <label className={labelClass}>Labels</label>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setLabelDropdownOpen(!labelDropdownOpen)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setLabelDropdownOpen(!labelDropdownOpen)
                          }
                        }}
                        className={cn(
                          inputBase,
                          'min-h-[34px] flex flex-wrap gap-1.5 items-center cursor-pointer',
                        )}
                      >
                        {selectedLabels.length === 0 && (
                          <span className="text-text-tertiary">Select labels...</span>
                        )}
                        {selectedLabels.map((label) => (
                          <span
                            key={label.id}
                            className="inline-flex items-center gap-1 text-xs text-white rounded-full px-2 py-0.5"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLabel(label.id)
                              }}
                              className="hover:opacity-80"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {labelDropdownOpen && labels.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-sm] shadow-[--shadow-md] max-h-48 overflow-y-auto">
                          {labels.map((label) => {
                            const isSelected = selectedIds.includes(label.id)
                            return (
                              <label
                                key={label.id}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-50 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleLabel(label.id)}
                                  className="rounded accent-primary-500"
                                />
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: label.color }}
                                />
                                <span className="text-text-primary">{label.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }}
              />

              {/* Due Date + Story Points + Estimated Hours row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Controller
                  name="due_date"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={labelClass}>Due Date</label>
                      <input
                        type="date"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className={inputBase}
                      />
                    </div>
                  )}
                />

                <Controller
                  name="story_points"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={labelClass}>Story Points</label>
                      <input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value)
                          field.onChange(val)
                        }}
                        min={0}
                        step={1}
                        className={inputBase}
                      />
                    </div>
                  )}
                />

                <Controller
                  name="estimated_hours"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={labelClass}>Estimated Hours</label>
                      <input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value)
                          field.onChange(val)
                        }}
                        min={0}
                        step={0.5}
                        className={inputBase}
                      />
                    </div>
                  )}
                />
              </div>

              {/* Parent ID (for subtasks) */}
              {parentId && (
                <Controller
                  name="parent_id"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={labelClass}>Parent Issue</label>
                      <input
                        type="text"
                        value={field.value ?? ''}
                        disabled
                        className={cn(inputBase, 'bg-surface-50 text-text-tertiary cursor-not-allowed')}
                      />
                      <p className="mt-1 text-xs text-text-tertiary">
                        This issue will be created as a sub-task
                      </p>
                    </div>
                  )}
                />
              )}

              {createMutation.isError && (
                <p className="text-sm text-error">
                  Failed to create issue. Please try again.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-[--radius-sm] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-[--radius-sm] transition-colors disabled:opacity-50 shadow-sm"
              >
                {createMutation.isPending && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                )}
                {createMutation.isPending ? 'Creating...' : 'Create Issue'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
