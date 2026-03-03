import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { useProjectStore } from '@/stores/projectStore'
import { formatDate, formatPercent } from '@/utils/formatters'
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useGateApprovals,
  useGateApproval,
  type CreateMilestoneInput,
} from '@/hooks/useMilestones'
import MilestoneTimeline from '@/components/milestones/MilestoneTimeline'
import GateApprovalCard from '@/components/milestones/GateApprovalCard'

// ---- Status config ----

const MILESTONE_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked'] as const
const MILESTONE_TYPES = ['milestone', 'gate', 'phase', 'deliverable'] as const

const STATUS_COLORS: Record<string, string> = {
  not_started: '#9e9e9e',
  in_progress: '#3574D4',
  completed: '#2E9E5A',
  blocked: '#D84040',
}

// ---- Gate Approvals sub-component ----

function GateApprovalsSection({ milestoneId }: { milestoneId: string }) {
  const { data, isLoading } = useGateApprovals(milestoneId)
  const { decideApproval } = useGateApproval()

  const handleDecide = (approvalId: string, decision: 'approved' | 'rejected') => {
    decideApproval.mutate({ approval_id: approvalId, decision })
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="skeleton-shimmer h-14 rounded-lg" />
      </div>
    )
  }

  const approvals = data?.data ?? []

  if (approvals.length === 0) {
    return (
      <div className="p-4">
        <span className="text-sm text-text-secondary">
          No gate approvals for this milestone.
        </span>
      </div>
    )
  }

  return (
    <div className="p-4">
      <span className="block text-sm font-semibold text-text-primary mb-2">
        Gate Approvals
      </span>
      {approvals.map((approval) => (
        <GateApprovalCard
          key={approval.id}
          approval={approval}
          onDecide={handleDecide}
        />
      ))}
    </div>
  )
}

// ---- Empty form state ----

const EMPTY_FORM: CreateMilestoneInput = {
  name: '',
  description: '',
  milestone_type: 'milestone',
  status: 'not_started',
  start_date: null,
  due_date: null,
}

// ---- Main component ----

export default function MilestonesPage() {
  const project = useProjectStore((s) => s.currentProject)
  const projectId = project?.id ?? ''

  const { data, isLoading, isError } = useMilestones(projectId)
  const createMutation = useCreateMilestone(projectId)
  const updateMutation = useUpdateMilestone(projectId)
  const deleteMutation = useDeleteMilestone(projectId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateMilestoneInput>(EMPTY_FORM)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const milestones = useMemo(() => data?.data ?? [], [data])

  // ---- Dialog handlers ----

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEditDialog = (m: (typeof milestones)[number]) => {
    setEditingId(m.id)
    setForm({
      name: m.name,
      description: m.description ?? '',
      milestone_type: m.milestone_type,
      status: m.status,
      start_date: m.start_date,
      due_date: m.due_date,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, body: form },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createMutation.mutate(form, {
        onSuccess: () => setDialogOpen(false),
      })
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // ---- Field updater ----

  const updateField = (field: keyof CreateMilestoneInput, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ---- Render ----

  const inputClass =
    'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'
  const labelClass = 'block text-sm font-medium text-text-primary mb-1'

  if (!projectId) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-sm">
          Select a project to view milestones.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Milestones</h1>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateDialog}>
          New Milestone
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          Failed to load milestones. Please try again.
        </div>
      )}

      {/* Timeline */}
      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface mb-6 p-4">
        <span className="block text-base font-semibold text-text-primary mb-2">
          Timeline
        </span>
        {isLoading ? (
          <div className="skeleton-shimmer h-[120px] rounded-lg" />
        ) : (
          <MilestoneTimeline milestones={milestones} />
        )}
      </div>

      {/* Table */}
      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase w-10" />
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Start</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Due</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Progress</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <>
                {[1, 2, 3].map((n) => (
                  <tr key={n}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <td key={i} className="px-4 py-2 border-t border-surface-200">
                        <div className="skeleton-shimmer h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {!isLoading && milestones.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-text-secondary">
                  No milestones found. Click &quot;New Milestone&quot; to create one.
                </td>
              </tr>
            )}

            {milestones.map((m) => {
              const isExpanded = expandedId === m.id
              const statusColor = STATUS_COLORS[m.status] ?? '#9e9e9e'

              return (
                <tbody key={m.id}>
                  <tr className="hover:bg-surface-50 transition-colors">
                    <td className={`px-4 py-2 ${isExpanded ? '' : 'border-t border-surface-200'}`}>
                      <button
                        className="p-1 rounded hover:bg-surface-100 text-text-secondary"
                        onClick={() => toggleExpand(m.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className={`px-4 py-2 ${isExpanded ? '' : 'border-t border-surface-200'}`}>
                      <span className="font-semibold text-text-primary">{m.name}</span>
                    </td>
                    <td className={`px-4 py-2 ${isExpanded ? '' : 'border-t border-surface-200'}`}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-200 text-text-secondary">
                        {m.milestone_type}
                      </span>
                    </td>
                    <td className={`px-4 py-2 ${isExpanded ? '' : 'border-t border-surface-200'}`}>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{
                          backgroundColor: `${statusColor}20`,
                          color: statusColor,
                        }}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-4 py-2 ${isExpanded ? '' : 'border-t border-surface-200'}`}>{formatDate(m.start_date)}</td>
                    <td className={`px-4 py-2 ${isExpanded ? '' : 'border-t border-surface-200'}`}>{formatDate(m.due_date)}</td>
                    <td className={`px-4 py-2 ${isExpanded ? '' : 'border-t border-surface-200'}`}>{formatPercent(m.progress_pct)}</td>
                    <td className={`px-4 py-2 text-right ${isExpanded ? '' : 'border-t border-surface-200'}`}>
                      <button
                        className="p-1 rounded hover:bg-surface-100 text-text-secondary mr-1"
                        onClick={() => openEditDialog(m)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-50 disabled:pointer-events-none"
                        onClick={() => handleDelete(m.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded gate approvals */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <div className="bg-surface-50">
                          <GateApprovalsSection milestoneId={m.id} />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? 'Edit Milestone' : 'Create Milestone'}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              autoFocus
              placeholder="Milestone name"
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={inputClass}
              value={form.description ?? ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select
              className={inputClass}
              value={form.milestone_type}
              onChange={(e) => updateField('milestone_type', e.target.value)}
            >
              {MILESTONE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              {MILESTONE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.start_date ?? ''}
                onChange={(e) => updateField('start_date', e.target.value || null)}
              />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.due_date ?? ''}
                onChange={(e) => updateField('due_date', e.target.value || null)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6 border-t-0 px-0">
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !form.name.trim() ||
              createMutation.isPending ||
              updateMutation.isPending
            }
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editingId ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
